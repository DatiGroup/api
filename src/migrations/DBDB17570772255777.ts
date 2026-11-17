import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from "typeorm";

export class DBDB17570772255777 implements MigrationInterface {
    name = 'DBDB17570772255777'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ==================== DB1749475697000 ====================
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS fnd`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS notifications`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS public`);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".agents (agent_id serial4 NOT NULL,parameters jsonb DEFAULT '{}'::jsonb NOT NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,agent_code varchar(30) NOT NULL,agent_type varchar(30) NOT NULL,CONSTRAINT "PK_3ba3ff16246ffc499a47106d19e" PRIMARY KEY (agent_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fnd".fnd_languages (language_id serial4 NOT NULL,language_code varchar(2) NOT NULL,iso_language varchar(3) NOT NULL,description varchar(255) NULL,enabled bool DEFAULT true NOT NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,CONSTRAINT "PK_43f4c473ffb0eba83d22db6ddbc" PRIMARY KEY (language_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fnd".fnd_lookups (lookup_id serial4 NOT NULL,lookup_type varchar(30) NOT NULL,enabled bool DEFAULT true NOT NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,editable bool DEFAULT false NOT NULL,CONSTRAINT "PK_cf1a4e884eb7de54e93de5c991e" PRIMARY KEY (lookup_id),CONSTRAINT "UQ_d6f7aebcbef73aa2134e199fef7" UNIQUE (lookup_type))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fnd".fnd_lookup_values (lookup_value_id serial4 NOT NULL,lookup_type varchar(30) NOT NULL,lookup_code varchar(30) NOT NULL,enabled bool NOT NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,attribute1 varchar(100) NULL,attribute2 varchar(100) NULL,attribute3 varchar(100) NULL,attribute4 varchar(100) NULL,attribute5 varchar(100) NULL,attribute6 varchar(100) NULL,attribute7 varchar(100) NULL,attribute8 varchar(100) NULL,attribute9 varchar(100) NULL,attribute10 varchar(100) NULL,attribute11 varchar(100) NULL,attribute12 varchar(100) NULL,attribute13 varchar(100) NULL,attribute14 varchar(100) NULL,attribute15 varchar(100) NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,agent_id int4 NULL,CONSTRAINT "PK_1fef5b6c78c04a5e37b6fb84ee5" PRIMARY KEY (lookup_value_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fnd".fnd_lookup_values_tl (language_id int4 NOT NULL,created_by int4 NOT NULL,created_date timestamp DEFAULT now() NOT NULL,updated_by int4 NOT NULL,lookup_value_id int4 NULL,lookup_value_tl_id serial4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,meaning varchar(255) NULL,description varchar(255) NULL,CONSTRAINT "PK_37bbbcea367484982a9028db566" PRIMARY KEY (lookup_value_tl_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fnd".fnd_lookups_tl (language_id int4 NOT NULL,created_by int4 NOT NULL,created_date timestamp DEFAULT now() NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,lookup_id int4 NOT NULL,lookup_tl_id serial4 NOT NULL,meaning varchar(255) NULL,description varchar(255) NULL,CONSTRAINT "PK_da9f1413437ced4a4b673443a6c" PRIMARY KEY (lookup_tl_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications".messages (message_id serial4 NOT NULL,agent_id int4 NOT NULL,template_id int4 NOT NULL,"type" varchar(30) NOT NULL,parameters jsonb DEFAULT '{}'::jsonb NOT NULL,sent bool DEFAULT false NOT NULL,confirmed bool DEFAULT false NOT NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,party_id int4 NOT NULL, deleted bool DEFAULT false NOT NULL,"text" text NOT NULL,category_type varchar(30) NOT NULL,opportunity_id int4 NULL,identifier varchar(30) NULL,declined bool DEFAULT false NOT NULL,CONSTRAINT "PK_6187089f850b8deeca0232cfeba" PRIMARY KEY (message_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".devices (user_device_id serial4 NOT NULL,user_id int4 NOT NULL,platform varchar(30) NOT NULL,browser varchar(30) NOT NULL,fingerprint varchar(255) NOT NULL,ip_address varchar(30) NOT NULL, start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,CONSTRAINT "PK_7b7948a87f13dba9346f5889825" PRIMARY KEY (user_device_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public"."sequences" (agent_id int4 NOT NULL,"type" varchar(30) NOT NULL,value int4 NOT NULL,length int4 NOT NULL,prefix varchar(3) NOT NULL,sequence_id serial4 NOT NULL,CONSTRAINT "PK_a6c0dc7875e0973cf3a5a08debe" PRIMARY KEY (sequence_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".sessions (session_id varchar(100) NOT NULL,user_id int4 NOT NULL,ip_address varchar NOT NULL,"location" varchar NOT NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,user_device_id int4 NOT NULL,CONSTRAINT "PK_9340188c93349808f10d1db74a8" PRIMARY KEY (session_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".templates (template_id serial4 NOT NULL,"type" varchar(30) NOT NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,identifier varchar(100) NOT NULL,subject varchar(200) NULL,lang varchar(2) DEFAULT 'en'::character varying NOT NULL,"content" varchar NULL,CONSTRAINT "PK_cfafdab99c9325e084ebb3f8aa0" PRIMARY KEY (template_id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".user_otp_codes (id serial4 NOT NULL,user_id int4 NOT NULL,"type" varchar(30) NOT NULL,used bool DEFAULT false NOT NULL,expired_date timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,otp_code varchar(20) NOT NULL,CONSTRAINT "PK_user_otp_codes_id" PRIMARY KEY (id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".user_two_fa_request (id serial4 NOT NULL,user_id int4 NULL,code int4 NOT NULL,created_date timestamp DEFAULT now() NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,approved_by int4 NULL,rejected_by int4 NULL,expired_date timestamp NULL,meta text NULL,wlp_id varchar(40) NULL,used bool DEFAULT false NOT NULL,CONSTRAINT "PK_85cd39c315e89d74c6ad404cfaa" PRIMARY KEY (id))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".users (user_id serial4 NOT NULL,agent_id int4 NOT NULL,user_name varchar(30) not NULL, email varchar(100) NULL,phone varchar(30) NULL,"password" varchar(64) NULL,salt varchar(48) NULL, external_user_id varchar(100) NULL, external_source varchar(100) NULL,start_date_active timestamp NULL,end_date_active timestamp NULL,created_date timestamp DEFAULT now() NOT NULL,created_by int4 NOT NULL,updated_by int4 NOT NULL,updated_date timestamp DEFAULT now() NOT NULL,preferred_lang varchar(2) NULL,CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY (user_id))`);

        // ==================== DB1757077223495 ====================
        // Create users_profile table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "public"."user_profile" (
                "user_profile_id" SERIAL PRIMARY KEY,
                "user_id" INTEGER UNIQUE NOT NULL,
                "first_name" VARCHAR(50) NULL,
                "last_name" VARCHAR(50) NULL,
                "preferred_lang" VARCHAR(2) NULL DEFAULT 'en',
                "created_by" INTEGER NOT NULL,
                "updated_by" INTEGER NOT NULL,
                "updated_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                CONSTRAINT "FK_users_profile_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE
            )
        `);

        // ==================== DB1757077223496 ====================
        await queryRunner.query(`
            ALTER TABLE fnd.fnd_lookups 
            DROP COLUMN IF EXISTS meaning
        `);

         await queryRunner.query(`
            ALTER TABLE fnd.fnd_lookups 
            DROP COLUMN IF EXISTS description
        `);

        // ==================== DB1757077223500 ====================
        await queryRunner.query(`
        INSERT INTO fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(1, 'en', 'ENG', 'English', true, current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);
INSERT INTO fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(2, 'lv', 'LVA', 'Latviski', true,current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);
INSERT INTO fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(3, 'et', 'EST', 'Estonia', true,current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);
INSERT INTO fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(4, 'lt', 'LIT', 'Lithuanian', true, current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);
INSERT INTO fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(5, 'fi', 'FIN', 'Finnish', true, current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);

INSERT into fnd.fnd_languages
(language_id, language_code, iso_language, description, enabled, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date)
VALUES(6, 'sv', 'SWE', 'Swedish', true, current_timestamp, NULL, current_timestamp, -1, -1, current_timestamp);
        `);

        // ==================== DB1757077223600 ====================
    await queryRunner.query(`
      
      ------------------------------ Insert sequence for FND ------------------------------
      INSERT INTO public."sequences" (
        agent_id, "type", value, length, prefix, sequence_id
      ) VALUES (
        -1, 'FND', 29, 10, 'FND', 4
      );

  ------------------------------ Insert lookup type ------------------------------
  INSERT INTO fnd.fnd_lookups (
        lookup_type, enabled, start_date_active, end_date_active,
        created_date, created_by, updated_by, updated_date, editable
      ) VALUES (
        'CLIENT_TYPE', true, current_date, NULL,
        current_date, -1, -1, current_date, true
      )
      ON CONFLICT (lookup_type) DO NOTHING;

  ------------------------------ Insert lookup values ------------------------------
  INSERT INTO fnd.fnd_lookup_values (
        lookup_type, lookup_code, enabled, start_date_active, agent_id, created_by, updated_by
      ) VALUES (
        'CLIENT_TYPE', 'INDIVIDUAL', false, '2025-09-16 15:00:10.863',
        NULL, -1, -1
      );

      INSERT INTO fnd.fnd_lookup_values (
        lookup_type, lookup_code, enabled, start_date_active, agent_id, created_by, updated_by
      ) VALUES (
        'CLIENT_TYPE', 'BUSINESS', false, '2025-09-16 15:00:10.863',
        NULL, -1, -1
      );

  ------------------------------ Insert lookup translations for all languages ------------------------------
  WITH
        lookup AS (
          SELECT lookup_id FROM fnd.fnd_lookups WHERE lookup_type = 'CLIENT_TYPE'
        ),
        lang AS (
          SELECT language_id, language_code
          FROM fnd.fnd_languages
          WHERE language_code IN ('en', 'lv', 'fi', 'et', 'lt', 'sv')
        ),
        vals AS (
          SELECT * FROM (VALUES
            ('en', 'Client Type', 'Client Type'),
            ('lv', 'Klienta tips', 'Klienta tips'),
            ('fi', 'Asiakkaan tyyppi', 'Asiakkaan tyyppi'),
            ('et', 'Kliendi tüüp', 'Kliendi tüüp'),
            ('lt', 'Kliento tipas', 'Kliento tipas'),
            ('sv', 'Kundtyp', 'Kundtyp')
          ) AS v(language_code, meaning, description)
        )
      INSERT INTO fnd.fnd_lookups_tl (
        language_id, lookup_id, meaning, description, created_by, created_date, updated_by, updated_date
      )
      SELECT
        lang.language_id,
        lookup.lookup_id,
        vals.meaning,
        vals.description,
        -1, current_date, -1, current_date
      FROM lang
      CROSS JOIN lookup
      JOIN vals ON vals.language_code = lang.language_code;

  ------------------------------ Insert lookup value translations for all languages and codes ------------------------------
  WITH
        lang AS (
          SELECT language_id, language_code
          FROM fnd.fnd_languages
          WHERE language_code IN ('en', 'lv', 'fi', 'et', 'lt', 'sv')
        ),
        lookup AS (
          SELECT lookup_value_id, lookup_code
          FROM fnd.fnd_lookup_values
          WHERE lookup_type = 'CLIENT_TYPE'
        )
      INSERT INTO fnd.fnd_lookup_values_tl (
        language_id, lookup_value_id, meaning, description, created_by, updated_by, created_date, updated_date
      )
      SELECT
        lang.language_id,
        lookup.lookup_value_id,
        CASE lookup.lookup_code
          WHEN 'INDIVIDUAL' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Individual'
              WHEN 'lv' THEN 'Indivīds'
              WHEN 'fi' THEN 'Yksityinen'
              WHEN 'et' THEN 'Individuaalne'
              WHEN 'lt' THEN 'Individualus'
              WHEN 'sv' THEN 'Individuell'
            END
          WHEN 'BUSINESS' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Business'
              WHEN 'lv' THEN 'Bizness'
              WHEN 'fi' THEN 'Yritys'
              WHEN 'et' THEN 'Äri'
              WHEN 'lt' THEN 'Verslas'
              WHEN 'sv' THEN 'Företag'
            END
        END AS meaning,
        CASE lookup.lookup_code
          WHEN 'INDIVIDUAL' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Individual client'
              WHEN 'lv' THEN 'Individuāls klients'
              WHEN 'fi' THEN 'Yksityisasiakas'
              WHEN 'et' THEN 'Individuaalne klient'
              WHEN 'lt' THEN 'Individualus klientas'
              WHEN 'sv' THEN 'Individuell klient'
            END
          WHEN 'BUSINESS' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Business client'
              WHEN 'lv' THEN 'Biznesa klients'
              WHEN 'fi' THEN 'Yritysasiakas'
              WHEN 'et' THEN 'Äriklient'
              WHEN 'lt' THEN 'Verslo klientas'
              WHEN 'sv' THEN 'Företagskund'
            END
        END AS description,
        -1, -1, current_date, current_date
      FROM lang
      CROSS JOIN lookup;
    `);

        // ==================== DB1757077223730 ====================
    // Create enum for status
    await queryRunner.query(`CREATE TYPE "request_status_enum" AS ENUM('pending', 'approved', 'rejected')`);

    // Create requests table
    await queryRunner.createTable(
      new Table({
        schema: 'public',
        name: 'approval_requests',
        columns: [
          {
            name: 'approval_request_id',
            type: 'serial4',
            isPrimary: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'status',
            type: '"request_status_enum"',
            isNullable: false,
            default: `'pending'`,
          },
          {
            name: 'assigned_to_user_id',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'assigned_to_kc_group',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'min_required_approvals',
            type: 'int',
            isNullable: false,
            default: 1,
          },
          {
            name: 'current_approvals_count',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_by',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'created_date',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'updated_date',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            isNullable: false,
          },
        ],
        checks: [
          {
            name: 'CHK_assigned_only_one',
            expression: `(assigned_to_user_id IS NOT NULL AND assigned_to_kc_group IS NULL) OR (assigned_to_user_id IS NULL AND assigned_to_kc_group IS NOT NULL)`
          }
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_requests_assigned_to_user',
        columnNames: ['assigned_to_user_id'],
      }),
    );

    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_approval_requests_entity_pending" 
            ON "approval_requests" ("entity_type", "entity_id") 
            WHERE "status" = 'pending'
        `);

        // ==================== DB1757077223731 ====================
    // Create enum type for action
    await queryRunner.query(`CREATE TYPE "approval_action_enum" AS ENUM('approved', 'rejected')`);

    // Create approvals table
    await queryRunner.createTable(
      new Table({
        schema: 'public',
        name: 'approval',
        columns: [
          {
            name: 'approval_id',
            type: 'serial4',
            isPrimary: true,
          },
          {
            name: 'approval_request_id',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'approved_by_user_id',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'action',
            type: '"approval_action_enum"',
            isNullable: false,
          },
          {
            name: 'comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'acted_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'approval',
      new TableForeignKey({
        columnNames: ['approval_request_id'],
        referencedTableName: 'approval_requests',
        referencedColumnNames: ['approval_request_id'],
      }),
    );

    // Add unique constraint to prevent duplicate approvals per user
    await queryRunner.createUniqueConstraint(
      'approval',
      new TableUnique({
        name: 'UQ_approvals_request_approver',
        columnNames: ['approval_request_id', 'approved_by_user_id'],
      }),
    );

        // ==================== DB1757077223740 ====================
    await queryRunner.query(`
      ALTER TABLE "public"."users"
      ADD COLUMN "approval_status" "request_status_enum";
    `);

        // ==================== DB1757077223741 ====================
        await queryRunner.query(`ALTER TABLE fnd.fnd_lookups ADD agent_id int4 NULL`);
        await queryRunner.query(`ALTER TABLE fnd.fnd_lookup_values ADD CONSTRAINT fnd_lookup_values_unique UNIQUE (lookup_type,lookup_code)`);

        // ==================== DB1757077223900 ====================
        // Create audit schema
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS audit`);

        // Create audit.agents table
        await queryRunner.query(`
            CREATE TABLE audit.agents (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                agent_id int4,
                parameters jsonb,
                start_date_active timestamp,
                end_date_active timestamp,
                created_date timestamp,
                created_by int4,
                updated_by int4,
                updated_date timestamp,
                agent_code varchar(30),
                agent_type varchar(30)
            )
        `);

        // Create process_agents function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.process_agents()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $function$
                BEGIN
                    IF (TG_OP = 'DELETE') THEN
                        INSERT INTO audit.agents SELECT 'DELETE', now(), OLD.*;
                        RETURN OLD;
                    ELSIF (TG_OP = 'UPDATE') THEN
                        INSERT INTO audit.agents SELECT 'UPDATE', now(), NEW.*;
                        RETURN NEW;
                    ELSIF (TG_OP = 'INSERT') THEN
                        INSERT INTO audit.agents SELECT 'INSERT', now(), NEW.*;
                        RETURN NEW;
                    END IF;
                    RETURN NULL;
                END;
            $function$;
        `);

        // Create trigger on public.agents
        await queryRunner.query(`
            CREATE TRIGGER agents_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.agents
            FOR EACH ROW EXECUTE FUNCTION public.process_agents();
        `);

        // ==================== DB1757077223910 ====================

        await queryRunner.query(`
            CREATE TABLE audit.approval (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                approval_id int4,
                approval_request_id int4,
                approved_by_user_id int4,
                action text,
                comments text,
                acted_at timestamp, 
                version int4
            )
        `);

        // Create process_agents function
        await queryRunner.query(`
           		CREATE OR REPLACE FUNCTION public.process_approval()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.approval SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.approval SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.approval SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER approval_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.approval
            FOR EACH ROW EXECUTE FUNCTION public.process_approval();
        `);

        // ==================== DB1757077223920 ====================

        await queryRunner.query(`
            CREATE TABLE audit.approval_requests (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                approval_request_id int4,
                entity_type varchar(100),
                entity_id int4,
                status varchar(50),
                assigned_to_user_id int4,
                assigned_to_kc_group varchar(255),
                min_required_approvals int4,
                current_approvals_count int4,
                created_by int4,
                created_date timestamp,
                updated_by int4,
                updated_date timestamp,
                "version" int4
            )
        `);

        // Create process_agents function
        await queryRunner.query(`
           		CREATE OR REPLACE FUNCTION public.process_approval_requests()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.approval_requests SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.approval_requests SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.approval_requests SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER approval_requests_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.approval_requests
            FOR EACH ROW EXECUTE FUNCTION public.process_approval_requests();
        `);

        // ==================== DB1757077223930 ====================

        await queryRunner.query(`
            CREATE TABLE audit.devices (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                user_device_id int4,
                user_id int4,
                platform varchar(30),
                browser varchar(30),
                fingerprint varchar(255),
                ip_address varchar(30),
                start_date_active timestamp,
                end_date_active timestamp,
                created_date timestamp,
                created_by int4,
                updated_by int4,
                updated_date timestamp
            )
        `);

        // Create process_agents function
        await queryRunner.query(`
           		CREATE OR REPLACE FUNCTION public.process_devices()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.devices SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.devices SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.devices SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER devices_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.devices
            FOR EACH ROW EXECUTE FUNCTION public.process_devices();
        `);

        // ==================== DB1757077223940 ====================

        await queryRunner.query(`
            CREATE TABLE audit.sessions (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                session_id varchar(100),
                user_id int4,
                ip_address varchar,
                "location" varchar,
                created_date timestamp,
                created_by int4,
                updated_by int4,
                updated_date timestamp,
                user_device_id int4
            )
        `);

        // Create process_agents function
        await queryRunner.query(`
           		CREATE OR REPLACE FUNCTION public.process_sessions()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.sessions SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.sessions SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.sessions SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER sessions_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.sessions
            FOR EACH ROW EXECUTE FUNCTION public.process_sessions();
        `);

        // ==================== DB1757077223950 ====================

        await queryRunner.query(`
            CREATE TABLE audit.users (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                user_id serial4,
                agent_id int4,
                user_name varchar(30),
                email varchar(100),
                phone varchar(30),
                "password" varchar(64),
                salt varchar(48),
                external_user_id varchar(100),
                external_source varchar(100),
                start_date_active timestamp,
                end_date_active timestamp,
                created_date timestamp,
                created_by int4,
                updated_by int4,
                updated_date timestamp, 
                approval_status varchar(30)
            )
        `);

        await queryRunner.query(`
           		CREATE OR REPLACE FUNCTION public.process_users()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.users SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.users SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.users SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER users_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.users
            FOR EACH ROW EXECUTE FUNCTION public.process_users();
        `);

        // ==================== DB1757077223960 ====================

        await queryRunner.query(`
            CREATE TABLE audit.user_profile (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                user_profile_id int4,
                user_id int4,
                first_name varchar(50),
                last_name varchar(50),
                preferred_lang varchar(2),
                created_by int4,
                updated_by int4,
                updated_date timestamp
            )
        `);

        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION public.process_user_profile()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.user_profile SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.user_profile SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.user_profile SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER user_profile_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.user_profile
            FOR EACH ROW EXECUTE FUNCTION public.process_user_profile();
        `);

        // ==================== DB1757077223970 ====================

        await queryRunner.query(`
            CREATE TABLE audit.user_two_fa_request (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                id int4,
                user_id int4,
                code int4,
                created_date timestamp,
                updated_date timestamp,
                approved_by int4,
                rejected_by int4,
                expired_date timestamp,
                meta text,
                wlp_id varchar(40),
                used bool
            )
        `);

        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION public.process_user_two_fa_request()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.user_two_fa_request SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.user_two_fa_request SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.user_two_fa_request SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER user_two_fa_request_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.user_two_fa_request
            FOR EACH ROW EXECUTE FUNCTION public.process_user_two_fa_request();
        `);

        // ==================== DB1757077223980 ====================

        await queryRunner.query(`
            CREATE TABLE audit.user_otp_codes (
                operation varchar NOT NULL,
                stamp timestamp DEFAULT now() NOT NULL,
                id int4,
                user_id int4,
                "type" varchar(30),
                used bool,
                expired_date timestamp,
                created_date timestamp,
                created_by int4,
                updated_by int4,
                updated_date timestamp,
                otp_code varchar(20)
            )
        `);

        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION public.process_user_otp_codes()
		 RETURNS trigger
		 LANGUAGE plpgsql
		AS $function$ 
		    BEGIN 
		        IF (TG_OP = 'DELETE') THEN  
		            INSERT INTO audit.user_otp_codes SELECT 'DELETE', now(), OLD.*;  
		            RETURN OLD; 
		        ELSIF (TG_OP = 'UPDATE') THEN 
		            INSERT INTO audit.user_otp_codes SELECT 'UPDATE', now(), NEW.*; 
		            RETURN NEW; 
		        ELSIF (TG_OP = 'INSERT') THEN 
		            INSERT INTO audit.user_otp_codes SELECT 'INSERT', now(), NEW.*; 
		            RETURN NEW; 
		        END IF; 
		        RETURN NULL; 
		    END; 
		$function$ ;
        `);

        await queryRunner.query(`
            CREATE TRIGGER user_otp_codes_audit
            AFTER INSERT OR DELETE OR UPDATE ON public.user_otp_codes
            FOR EACH ROW EXECUTE FUNCTION public.process_user_otp_codes();
        `);

        // ==================== DB1757077224000 ====================
        await queryRunner.query(`
            CREATE TABLE public.admin_activity_log (
                admin_activity_log_id SERIAL PRIMARY KEY,
                agent_id INT NOT NULL,
                entity_type VARCHAR(30) NOT NULL,
                entity_id INT,
                action VARCHAR(50),
                api text,
                details JSONB,
                created_by INT NOT NULL, 
                created_date TIMESTAMP NOT NULL DEFAULT now() 
            );
        `);
        await queryRunner.query(`
            CREATE INDEX idx_admin_activity_log_agent_entity
                ON public.admin_activity_log (agent_id, entity_type);
        `);

        // ==================== DB1757077224010 ====================
        await queryRunner.query(`
            ALTER TABLE public.users
            DROP COLUMN IF EXISTS preferred_lang;
        `);

        // ==================== DB1757077224020 ====================
        await queryRunner.query(`
            ALTER TABLE audit.users
            DROP COLUMN IF EXISTS phone;
        `);
        await queryRunner.query(`
            ALTER TABLE public.users
            DROP COLUMN IF EXISTS phone;
        `);

        // ==================== DB1757077224030 ====================
        await queryRunner.query(`
            ALTER TABLE public.admin_activity_log
            ADD COLUMN IF NOT EXISTS request_id VARCHAR(40);
        `);

        // ==================== DB1757077224065Timestamptz ====================
    await queryRunner.query(`
            ALTER TABLE audit.agents ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.agents ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE audit.agents ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.agents ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE audit.agents ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.approval ALTER COLUMN acted_at TYPE timestamptz USING acted_at::timestamptz;
            ALTER TABLE audit.approval ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.approval_requests ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.approval_requests ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.approval_requests ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.devices ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.devices ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE audit.devices ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.devices ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE audit.devices ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.sessions ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.sessions ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.sessions ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.user_otp_codes ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.user_otp_codes ALTER COLUMN expired_date TYPE timestamptz USING expired_date::timestamptz;
            ALTER TABLE audit.user_otp_codes ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.user_otp_codes ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.user_profile ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.user_profile ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.user_two_fa_request ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.user_two_fa_request ALTER COLUMN expired_date TYPE timestamptz USING expired_date::timestamptz;
            ALTER TABLE audit.user_two_fa_request ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.user_two_fa_request ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE audit.users ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE audit.users ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE audit.users ALTER COLUMN stamp TYPE timestamptz USING stamp::timestamptz;
            ALTER TABLE audit.users ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE audit.users ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;

            ALTER TABLE fnd.fnd_languages ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE fnd.fnd_languages ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE fnd.fnd_languages ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE fnd.fnd_languages ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values_tl ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE fnd.fnd_lookup_values_tl ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE fnd.fnd_lookups ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE fnd.fnd_lookups ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE fnd.fnd_lookups ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE fnd.fnd_lookups ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE fnd.fnd_lookups_tl ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE fnd.fnd_lookups_tl ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;

            ALTER TABLE notifications.messages ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE notifications.messages ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;

            ALTER TABLE public.admin_activity_log ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.agents ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.agents ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE public.agents ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE public.agents ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.approval ALTER COLUMN acted_at TYPE timestamptz USING acted_at::timestamptz;
            ALTER TABLE public.approval_requests ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.approval_requests ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.devices ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.devices ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE public.devices ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE public.devices ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.sessions ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.sessions ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.templates ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.templates ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE public.templates ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE public.templates ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.user_otp_codes ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.user_otp_codes ALTER COLUMN expired_date TYPE timestamptz USING expired_date::timestamptz;
            ALTER TABLE public.user_otp_codes ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.user_profile ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.user_two_fa_request ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.user_two_fa_request ALTER COLUMN expired_date TYPE timestamptz USING expired_date::timestamptz;
            ALTER TABLE public.user_two_fa_request ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
            ALTER TABLE public.users ALTER COLUMN created_date TYPE timestamptz USING created_date::timestamptz;
            ALTER TABLE public.users ALTER COLUMN end_date_active TYPE timestamptz USING end_date_active::timestamptz;
            ALTER TABLE public.users ALTER COLUMN start_date_active TYPE timestamptz USING start_date_active::timestamptz;
            ALTER TABLE public.users ALTER COLUMN updated_date TYPE timestamptz USING updated_date::timestamptz;
        `);

        // ==================== DB1757077224100 ====================
        await queryRunner.query(`
            ALTER TABLE fnd.fnd_lookups
            ADD COLUMN purpose VARCHAR(30);
        `);

        // ==================== DB1757077224230 ====================
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'user_profile'
                      AND column_name = 'created_date'
                ) THEN
                    ALTER TABLE public.user_profile
                    ADD COLUMN created_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL;
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'audit'
                      AND table_name = 'user_profile'
                      AND column_name = 'created_date'
                ) THEN
                    ALTER TABLE audit.user_profile
                    ADD COLUMN created_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL;
                END IF;
            END
            $$;
        `);



        await queryRunner.query(`CREATE TABLE public.user_organizations (
     user_organization_id serial4 PRIMARY KEY,
	"name" varchar NULL,
	root_user_id int4 NOT NULL,
	registration_number varchar NULL,
	country varchar NULL,
	start_date_active timestamptz NOT NULL,
	end_date_active timestamptz NULL,
	created_by int4 NOT NULL,
	created_date timestamptz DEFAULT now() NOT NULL,
	updated_by int4 NOT NULL,
	updated_date timestamptz DEFAULT now() NOT NULL 
)
`);

        await queryRunner.query(`
    CREATE INDEX idx_user_organizations_root_user_id
    ON public.user_organizations (root_user_id);
`);

        await queryRunner.query(`
    ALTER TABLE public.user_organizations
    ADD CONSTRAINT fk_user_organizations_root_user
    FOREIGN KEY (root_user_id) REFERENCES public.users(user_id);
`);


        await queryRunner.query(`CREATE TABLE public.user_relationships (
    user_relationships_id serial4 PRIMARY KEY,
	user_id int4 NOT NULL,
	user_organization_id int4 NOT NULL, 
	start_date_active timestamptz NOT NULL,
	end_date_active timestamptz NULL,
	created_by int4 NOT NULL,
	created_date timestamptz DEFAULT now() NOT NULL,
	updated_by int4 NOT NULL,
	updated_date timestamptz DEFAULT now() NOT NULL 
)`);

        await queryRunner.query(`CREATE INDEX idx_user_relationships_user_id ON public.user_relationships (user_id) `);
        await queryRunner.query(`CREATE INDEX idx_user_relationships_user_organization_id  ON public.user_relationships (user_organization_id); `);
        await queryRunner.query(`ALTER TABLE public.user_relationships
    ADD CONSTRAINT fk_user_relationships_user
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) `);

        await queryRunner.query(` ALTER TABLE public.user_relationships
    ADD CONSTRAINT fk_user_relationships_user_organization
    FOREIGN KEY (user_organization_id) REFERENCES public.user_organizations(user_organization_id) `);

        // ==================== DB1757077224250 ====================
        await queryRunner.query(`
  INSERT INTO public."sequences" (agent_id, "type", value, length, prefix)
  SELECT -1, 'OBJECT', 1, 10, 'OBJ'
  WHERE NOT EXISTS (
    SELECT 1 FROM public."sequences" WHERE agent_id = -1 AND "type" = 'OBJECT'
  );
`);

        // ==================== DB1757077224261NK ====================
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public.user_organizations
            ADD COLUMN IF NOT EXISTS contact_name character varying(50),
            ADD COLUMN IF NOT EXISTS contact_last_name character varying(50),
            ADD COLUMN IF NOT EXISTS contact_email character varying(100);
     `);

        // ==================== DB1757077224262NK ====================
    await queryRunner.query(`

      ------------------------------ Delete existing REGISTRATION_COUNTRIES data ------------------------------
      DELETE FROM fnd.fnd_lookup_values_tl
      WHERE lookup_value_id IN (
        SELECT lookup_value_id FROM fnd.fnd_lookup_values WHERE lookup_type = 'REGISTRATION_COUNTRIES'
      );

      DELETE FROM fnd.fnd_lookup_values
      WHERE lookup_type = 'REGISTRATION_COUNTRIES';

      DELETE FROM fnd.fnd_lookups_tl
      WHERE lookup_id IN (
        SELECT lookup_id FROM fnd.fnd_lookups WHERE lookup_type = 'REGISTRATION_COUNTRIES'
      );

      DELETE FROM fnd.fnd_lookups
      WHERE lookup_type = 'REGISTRATION_COUNTRIES';

      ------------------------------ Insert lookup type ------------------------------
      INSERT INTO fnd.fnd_lookups (
        lookup_type, enabled, start_date_active, end_date_active,
        created_date, created_by, updated_by, updated_date, editable
      ) VALUES (
        'REGISTRATION_COUNTRIES', true, current_date, NULL,
        current_date, -1, -1, current_date, true
      )
      ON CONFLICT (lookup_type) DO NOTHING;

      ------------------------------ Insert lookup values ------------------------------
      INSERT INTO fnd.fnd_lookup_values (
        lookup_type, lookup_code, enabled, start_date_active, agent_id, created_by, updated_by
      ) VALUES (
        'REGISTRATION_COUNTRIES', 'LV', false, current_date,
        NULL, -1, -1
      );

      ------------------------------ Insert lookup values ------------------------------
      INSERT INTO fnd.fnd_lookup_values (
        lookup_type, lookup_code, enabled, start_date_active, agent_id, created_by, updated_by
      ) VALUES (
        'REGISTRATION_COUNTRIES', 'LT', false, current_date,
        NULL, -1, -1
      );

      ------------------------------ Insert lookup values ------------------------------
      INSERT INTO fnd.fnd_lookup_values (
        lookup_type, lookup_code, enabled, start_date_active, agent_id, created_by, updated_by
      ) VALUES (
        'REGISTRATION_COUNTRIES', 'EE', false, current_date,
        NULL, -1, -1
      );
      
      ------------------------------ Insert lookup translations for all languages ------------------------------
      WITH
        lookup AS (
          SELECT lookup_id FROM fnd.fnd_lookups WHERE lookup_type = 'REGISTRATION_COUNTRIES'
        ),
        lang AS (
          SELECT language_id, language_code
          FROM fnd.fnd_languages
          WHERE language_code IN ('en', 'lv', 'fi', 'et', 'lt', 'sv')
        ),
        vals AS (
          SELECT * FROM (VALUES
            ('en', 'Registration countries', 'Registration countries'),
            ('lv', 'Reģistrācijas valstis', 'Reģistrācijas valstis'),
            ('fi', 'Rekisteröintimaat', 'Rekisteröintimaat'),
            ('et', 'Registreerimisriigid', 'Registreerimisriigid'),
            ('lt', 'Registracijos šalys', 'Registracijos šalys'),
            ('sv', 'Registreringsländer', 'Registreringsländer')
          ) AS v(language_code, meaning, description)
        )
      INSERT INTO fnd.fnd_lookups_tl (
        language_id, lookup_id, meaning, description, created_by, created_date, updated_by, updated_date
      )
      SELECT
        lang.language_id,
        lookup.lookup_id,
        vals.meaning,
        vals.description,
        -1, current_date, -1, current_date
      FROM lang
      CROSS JOIN lookup
      JOIN vals ON vals.language_code = lang.language_code;

      ------------------------------ Insert lookup value translations for all languages and codes ------------------------------
      WITH
        lang AS (
          SELECT language_id, language_code
          FROM fnd.fnd_languages
          WHERE language_code IN ('en', 'lv', 'fi', 'et', 'lt', 'sv')
        ),
        lookup AS (
          SELECT lookup_value_id, lookup_code
          FROM fnd.fnd_lookup_values
          WHERE lookup_type = 'REGISTRATION_COUNTRIES'
        )
      INSERT INTO fnd.fnd_lookup_values_tl (
        language_id, lookup_value_id, meaning, description, created_by, updated_by, created_date, updated_date
      )
      SELECT
        lang.language_id,
        lookup.lookup_value_id,
        CASE lookup.lookup_code
          WHEN 'LV' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Latvia'
              WHEN 'lv' THEN 'Latvija'
              WHEN 'fi' THEN 'Latvia'
              WHEN 'et' THEN 'Latvia'
              WHEN 'lt' THEN 'Latvia'
              WHEN 'sv' THEN 'Latvia'
            END
          WHEN 'LT' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Lithuania'
              WHEN 'lv' THEN 'Lietuva'
              WHEN 'fi' THEN 'Liettua'
              WHEN 'et' THEN 'Leedu'
              WHEN 'lt' THEN 'Lietuva'
              WHEN 'sv' THEN 'Lietuva'
            END
          WHEN 'EE' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Estonia'
              WHEN 'lv' THEN 'Igaunija'
              WHEN 'fi' THEN 'Viro'
              WHEN 'et' THEN 'Eesti'
              WHEN 'lt' THEN 'Estija'
              WHEN 'sv' THEN 'Estland'
            END
        END AS meaning,
        CASE lookup.lookup_code
          WHEN 'LV' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Latvia'
              WHEN 'lv' THEN 'Latvija'
              WHEN 'fi' THEN 'Latvia'
              WHEN 'et' THEN 'Latvia'
              WHEN 'lt' THEN 'Latvia'
              WHEN 'sv' THEN 'Latvia'
            END
          WHEN 'LT' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Lithuania'
              WHEN 'lv' THEN 'Lietuva'
              WHEN 'fi' THEN 'Liettua'
              WHEN 'et' THEN 'Leedu'
              WHEN 'lt' THEN 'Lietuva'
              WHEN 'sv' THEN 'Lietuva'
            END
          WHEN 'EE' THEN
            CASE lang.language_code
              WHEN 'en' THEN 'Estonia'
              WHEN 'lv' THEN 'Igaunija'
              WHEN 'fi' THEN 'Viro'
              WHEN 'et' THEN 'Eesti'
              WHEN 'lt' THEN 'Estija'
              WHEN 'sv' THEN 'Estland'
            END
        END AS description,
        -1, -1, current_date, current_date
      FROM lang
      CROSS JOIN lookup;
    `);

        // ==================== DB1757077224263NK ====================
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'user_organizations_registration_country_unique'
                ) THEN
                    ALTER TABLE public.user_organizations
                    ADD CONSTRAINT user_organizations_registration_country_unique
                    UNIQUE (registration_number, country);
                END IF;
            END $$;
        `);

        // ==================== DB1757077224280 ====================
    await queryRunner.query(`
    ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS info_email varchar(100);
  `);
    await queryRunner.query(`
    ALTER TABLE audit.agents ADD COLUMN IF NOT EXISTS info_email varchar(100);
  `);

        // ==================== DB1757077224350UserInvitation ====================
        await queryRunner.query(`
            CREATE TABLE  IF NOT EXISTS public.user_invitation (
                invitation_id SERIAL PRIMARY KEY,
                user_organization_id INTEGER NOT NULL,
                email VARCHAR(100) NOT NULL,
                invitation_code VARCHAR(32) NOT NULL,
                used BOOLEAN NOT NULL DEFAULT false,
                used_date TIMESTAMPTZ DEFAULT NULL,
                expired_date TIMESTAMPTZ DEFAULT NULL,
                created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER,
                updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                CONSTRAINT fk_user_invitation_user FOREIGN KEY (user_id) REFERENCES public.users(user_id),
                CONSTRAINT fk_user_invitation_org FOREIGN KEY (user_organization_id) REFERENCES public.user_organizations(user_organization_id)
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_user_invitation_email ON public.user_invitation(email)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_user_invitation_code ON public.user_invitation(invitation_code)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_user_invitation_org ON public.user_invitation(user_organization_id)
        `);

        // ==================== DB1757077225000 ====================
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'request_status_enum'
                ) THEN
                    BEGIN
                        ALTER TYPE request_status_enum ADD VALUE IF NOT EXISTS 'invite';
                    EXCEPTION
                        WHEN duplicate_object THEN
                            -- Value already exists; do nothing
                            NULL;
                    END;
                ELSE
                    RAISE NOTICE 'Type request_status_enum does not exist';
                END IF;
            END
            $$;
        `);

        // ==================== DB1757077225010 ====================
        // Create enum type
        await queryRunner.query(`
            CREATE TYPE terms_enum_type AS ENUM ('PRIVACY_POLICY', 'TERMS_AND_CONDITIONS');
        `);

        // Create terms table
        await queryRunner.query(`
            CREATE TABLE public.terms (
                term_id SERIAL PRIMARY KEY,
                type VARCHAR(30) NOT NULL,
                version VARCHAR(30),
                agent_id INTEGER NOT NULL,
                language_code VARCHAR(2) NOT NULL,
                content_html TEXT NOT NULL,
                start_date_active TIMESTAMPTZ NOT NULL,
                end_date_active TIMESTAMPTZ DEFAULT NULL,
                created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER,
                updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes if needed
        await queryRunner.query(`
            CREATE INDEX idx_terms_agent_language ON public.terms(agent_id, language_code);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_terms_type ON public.terms(type);
        `);

        // ==================== DB1757077225360AddUuidToUsers ====================
        // Add uuid column to users table
        await queryRunner.query(`
            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE audit.users
            ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE public.agents
            ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE audit.agents
            ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT NULL
        `);

        // ==================== DB1757077225467AlterTable ====================
    await queryRunner.query(
      `ALTER TABLE "fnd"."fnd_lookups" ALTER COLUMN "lookup_type" TYPE VARCHAR(100)`,
    )
    await queryRunner.query(
      `ALTER TABLE "fnd"."fnd_lookups" ALTER COLUMN "purpose" TYPE VARCHAR(100)`,
    )

        // ==================== DB1757077225469AlterTable ====================
    await queryRunner.query(
      `ALTER TABLE "fnd"."fnd_lookup_values" ALTER COLUMN "lookup_type" TYPE VARCHAR(100)`,
    )
    await queryRunner.query(
      `ALTER TABLE "fnd"."fnd_lookup_values" ALTER COLUMN "lookup_code" TYPE VARCHAR(100)`,
    )

        // ==================== Default agent (replaces DB1749475697010) ====================
        await queryRunner.query(`
            INSERT INTO public.agents( agent_id, parameters, start_date_active, end_date_active, created_date, created_by, updated_by, updated_date, agent_code, agent_type, info_email, uuid) 
            SELECT  
                   1,
                  '{
    "branding": {
        "logoUrl": "https://ec.europa.eu/regional_policy/images/information-sources/logo-download-center/eu_flag.jpg",
        "primaryColor": "#004A54",
        "primaryColorText": "#FFFFFF"
    },
    "agentName": "Digital Twins",
    "fromEmail": "no-reply@digital-twins.com",
    "languages": [
        "en",
        "lv"
    ],
    "portalUrl": "http://digital-twins.com",
    "approvalEmail": "twins@digital-twins.com",
    "defaultLanguage": "en"
}'::jsonb,
                  '2017-03-14 00:00:00+00'::timestamptz, 
                   NULL, 
                  '2025-09-17 11:34:56.631875+00'::timestamptz, 
                   -1, 
                   -1, 
                  '2026-10-07 06:56:34.483+00'::timestamptz, 
                   'digital-twins', 
                   'TWINS', 
                   'twins@digital-twins.com', 
                   'bfdd2f0f-2841-4e1e-acf0-0510f4cd5973'::uuid
            WHERE NOT EXISTS (SELECT 1 FROM public.agents WHERE agent_code = 'digital-twins')
        `);

        // agent_id was inserted explicitly, so move the serial sequence past it
        await queryRunner.query(`
            SELECT setval(pg_get_serial_sequence('public.agents', 'agent_id'), (SELECT MAX(agent_id) FROM public.agents))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
