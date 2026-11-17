import { FastifyInstance } from 'fastify'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import { IsNull, LessThan, MoreThan, Or } from 'typeorm'
import {
  CreateTemplateType,
  ProcessTemplateResponse,
  ProcessTemplateType,
} from './_types'
import { Templates, TemplateType } from '../../entities/public/templates.entity'
import { SendSmtpEmail } from '@getbrevo/brevo'
import i18next from 'i18next'
import { Agents } from '../../entities/public/agents.entity'
import { Users } from '../../entities/public/users.entity'
import { createUserError } from '../../utils/errors'

export async function createEmailTemplates(
  fastify: FastifyInstance,
  payload: CreateTemplateType,
) {
  //dist/templates/email
  const fileLocation = path.join(__dirname, '../../templates/emails') //   dist/templates/emails

  //   console.log('Loading email templates from', fileLocation);
  const templateBody = await loadTemplateBody(
    `${fileLocation}/${payload.fileName}`,
  )

  if (!templateBody) {
    console.log(
      `File not found: ${payload.fileName} at location  ${fileLocation}`,
    )
    return
  }

  const notificationTemplateRepository =
    fastify.orm['typeorm'].getRepository(Templates)
  const existingTemplate = await notificationTemplateRepository.findOne({
    where: {
      identifier: payload.identifier,
      lang: payload.lang,
      type: payload.type,
    },
  })

  if (existingTemplate) {
    if (payload.replace) {
      existingTemplate.subject = payload.subject || existingTemplate?.subject
      existingTemplate.content = templateBody || existingTemplate?.content
      existingTemplate.updatedBy = -1
      return await notificationTemplateRepository.save(existingTemplate)
    } else {
      console.log(
        `Templates exists template: ${payload.identifier}, skip loading`,
      )
      return
    }
  } else {
    console.log(`Creating template: ${payload.identifier}`)
    const entity = new Templates()
    entity.type = payload.type
    entity.identifier = payload.identifier
    entity.subject = payload?.subject
    entity.content = templateBody
    entity.lang = payload.lang
    entity.startDateActive = new Date()
    entity.createdBy = -1
    entity.updatedBy = -1
    return await notificationTemplateRepository.save(entity)
  }
}

async function loadTemplateBody(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, contents) => {
      if (err) {
        reject(err)
      } else {
        resolve(contents.toString())
      }
    })
  })
}

export async function processTemplate(
  fastify: FastifyInstance,
  payload: ProcessTemplateType,
): Promise<ProcessTemplateResponse> {
  const notificationTemplateRepository =
    fastify.orm['typeorm'].getRepository(Templates)

  // console.log('payload', payload);

  const templates = await notificationTemplateRepository.find({
    where: {
      identifier: payload.templateIdentifier,
      type: payload.type,
      startDateActive: LessThan(new Date()),
      endDateActive: Or(IsNull(), MoreThan(new Date())),
    },
  })

  const template =
    templates.find((template: Templates) => template.lang === payload.lang) ||
    templates[0]

  if (!template) {
    console.log('Template not found')
    throw fastify.httpErrors.expectationFailed('error.templateNotFound')
  }

  Handlebars.registerHelper('t', function (key, options) {
    return i18next.t(key, options.hash)
  })

  Handlebars.registerHelper('customCss', function (cssPayload: string) {
    if (!cssPayload) return ''

    return new Handlebars.SafeString(
      `<style type="text/css">${cssPayload}</style>`,
    )
  })

  Handlebars.registerHelper('customHtml', function (htmlPayload: string) {
    if (!htmlPayload) return ''

    return new Handlebars.SafeString(htmlPayload)
  })

  const bodyTemplate = Handlebars.compile(template.content)
  await i18next.changeLanguage(payload.lang)
  const bodyInterpolated = bodyTemplate(payload.payload)

  // Convert CSS variables to inline styles for email compatibility
  const cssVariables = {
    'primary-color': payload.payload.primaryColor || '#003399',
    'primary-color-text': payload.payload.primaryColorText || '#FFFFFF',
  }

  const bodyAdjusted = convertCssVariablesToInlineStyles(
    bodyInterpolated,
    cssVariables,
  )

  const subject =
    payload.subject ??
    (template?.subject
      ? i18next.t(template?.subject, payload.payload).toString()
      : '')

  return {
    body: bodyAdjusted,
    subject: subject,
  }
}

interface SendEmailProps {
  fastify: FastifyInstance
  agent: Agents
  user: Users
  templateIdentifier: string
  toEmail?: string
  payload?: Record<string, any>
}

export async function sendEmail({
  fastify,
  templateIdentifier,
  agent,
  user,
  toEmail,
  payload,
}: SendEmailProps) {
  const parameters = agent?.parameters as any
  const lang =
    user?.profile?.preferredLang || parameters?.defaultLanguage || 'en'
  const to = toEmail || user?.email
  const agentName = parameters?.agentName ?? agent?.agentCode
  const fromEmail = parameters?.fromEmail

  if (!to) {
    throw fastify.httpErrors.badRequest('SendEmail User email missing')
  }
  if (!agentName) {
    throw fastify.httpErrors.badRequest('SendEmail Agent missing')
  }
  if (!fromEmail) {
    throw fastify.httpErrors.badRequest('SendEmail fromEmail missing')
  }

  const commonEmailVariables = {
    agentName: agentName,
    fromEmail: fromEmail,
    logoUrl: parameters?.branding?.logoUrl,
    primaryColor: parameters?.branding?.primaryColor || '#FFFFFF',
    primaryColorText: parameters?.branding?.primaryColorText || '#000000',
  }

  const content = await processTemplate(fastify, {
    templateIdentifier: templateIdentifier,
    subject: payload?.subjectPayload,
    lang: lang,
    type: TemplateType.EMAIL,
    payload: { ...payload, ...commonEmailVariables },
  })

  const msg: SendSmtpEmail = {
    to: [
      {
        email: to,
      },
    ],
    sender: {
      name: commonEmailVariables.agentName,
      email: commonEmailVariables.fromEmail,
    },
    subject: content.subject,
    htmlContent: content.body,
  }

  /*     console.log('Sending email', { to: msg.to, sender: msg.sender, subject: msg.subject });
        console.log("----- HTML Content Start -----");
        console.log(content.body);
        console.log("----- HTML Content End -----"); */

  try {
    console.log(`Send email to ${to}`)

    await fastify.brevo.sendTransacEmail(msg)
    console.log(`Send email to ${to} success`)
  } catch (error: any) {
    console.log(`Send email to ${to} failed`)
    let errorMessage = 'Unexpected error'

    if (error?.response) {
      console.error(error?.response?.data)

      console.error('Brevo API Error Details:')
      console.error('Status:', error.response.status)
      console.error('Status Text:', error.response.statusText)
      // Extract specific error message
      errorMessage =
        error.response.body?.message ||
        error.response.body?.error ||
        error.response.statusText ||
        'Unknown API error'
    } else {
      console.error(error)
    }

    throw new Error(`Email sending failed: ${errorMessage}`)
  }
}

function convertCssVariablesToInlineStyles(
  html: string,
  variables: Record<string, string>,
): string {
  let processedHtml = html

  // Extract the style block content
  const styleMatch = processedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (!styleMatch) return processedHtml

  let cssContent = styleMatch[1]

  // First, replace CSS variables with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const cssVar = `var(--${key})`
    const regex = new RegExp(cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    cssContent = cssContent.replace(regex, value)
  })

  // Remove :root block since we don't need it anymore
  cssContent = cssContent.replace(/:root\s*{[^}]*}/g, '')

  // Parse CSS rules and convert them to inline styles
  const cssRules = parseCssRules(cssContent)

  // Apply inline styles to matching elements
  cssRules.forEach(rule => {
    if (rule.selector.startsWith('.')) {
      // Handle class selectors
      const className = rule.selector.substring(1).trim()

      // Handle both single and double quotes for class attributes
      const doubleQuoteRegex = new RegExp(
        `(<[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*)>`,
        'g',
      )
      const singleQuoteRegex = new RegExp(
        `(<[^>]*class='[^']*\\b${className}\\b[^']*'[^>]*)>`,
        'g',
      )

      // Process double quote class attributes
      processedHtml = processedHtml.replace(
        doubleQuoteRegex,
        (match, elementStart) => {
          const existingStyleMatch = match.match(/\bstyle="([^"]*)"/)
          if (existingStyleMatch) {
            const existingStyles = existingStyleMatch[1]
            const newStyles = existingStyles
              ? `${existingStyles}; ${rule.styles}`
              : rule.styles
            return match.replace(/\bstyle="[^"]*"/, `style="${newStyles}"`)
          } else {
            return `${elementStart} style="${rule.styles}">`
          }
        },
      )

      // Process single quote class attributes
      processedHtml = processedHtml.replace(
        singleQuoteRegex,
        (match, elementStart) => {
          const existingStyleMatch = match.match(/\bstyle='([^']*)'/)
          if (existingStyleMatch) {
            const existingStyles = existingStyleMatch[1]
            const newStyles = existingStyles
              ? `${existingStyles}; ${rule.styles}`
              : rule.styles
            return match.replace(/\bstyle='[^']*'/, `style='${newStyles}'`)
          } else {
            return `${elementStart} style='${rule.styles}'>`
          }
        },
      )
    }
  })

  // Update the style block to show processed CSS (keeping for fallback)
  processedHtml = processedHtml.replace(
    styleMatch[0],
    `<style type="text/css">/* CSS variables converted to inline styles */\n${cssContent}\n</style>`,
  )

  return processedHtml
}

function parseCssRules(
  css: string,
): Array<{ selector: string; styles: string }> {
  const rules: Array<{ selector: string; styles: string }> = []

  // Remove comments and normalize whitespace
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Match CSS rules (selector { properties })
  const ruleMatches = css.match(/([^{]+)\{([^}]+)\}/g)

  if (ruleMatches) {
    ruleMatches.forEach(ruleMatch => {
      const parts = ruleMatch.match(/([^{]+)\{([^}]+)\}/)
      if (parts) {
        const selector = parts[1].trim()
        const properties = parts[2].trim()

        // Convert properties to inline style format
        const styles = properties
          .split(';')
          .map(prop => prop.trim())
          .filter(prop => prop.length > 0)
          .join('; ')

        if (styles) {
          rules.push({ selector, styles })
        }
      }
    })
  }

  return rules
}
