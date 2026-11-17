import moment from "moment";
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PaginateParams, PaginateResults } from "../../sharedShema/sharedSchema";

export function isEmpty(val: any, allowEmptyArrayOrObject?: boolean): boolean {
    if (val == null) {
        return true;
    }

    if (Array.isArray(val)) {
        if (val.length < 1 && !allowEmptyArrayOrObject) {
            return true;
        }
        return false;
    }

    // lets check for object
    if (val.constructor === Object) {
        if (Object.keys(val).length < 1 && !allowEmptyArrayOrObject) {
            return true;
        }
        return false;
    }

    if (String(val).trim() == "") {
        return true;
    }

    return false;
}

export interface DateRange {
    dateForm: any;
    dateTo: any;
}

export type FilterRestriction = {
    defaultIfEmptyOrIncorrect: string,
    allowedValues?: string[]
};

export type FilterRestrictions = Record<string, FilterRestriction>;
declare module 'fastify' {
    interface FastifyInstance {
        baseUtils: {
            isEmpty(val: any, allowEmptyArrayOrObject?: boolean): boolean,
            applyFilter<T extends ObjectLiteral>(
                filters: string,
                filterMap: any,
                qb: SelectQueryBuilder<T>,
                filterRestrictions: FilterRestrictions
            ): SelectQueryBuilder<T>,
            applyFilterSection<T extends ObjectLiteral>(
                filterName: string,
                filterValue: string,
                filterMap: any,
                qb: SelectQueryBuilder<T>,
                filterRestrictions: FilterRestrictions
            ): SelectQueryBuilder<T>,
            getManyPaginateResults<T extends ObjectLiteral>(
                { params, query, defaultOrderBy, customOrderMapping }: { params: PaginateParams, query: SelectQueryBuilder<T>, defaultOrderBy?: string, customOrderMapping?: any }
            ): Promise<PaginateResults<T>>,
            getPaginateResults<T extends ObjectLiteral>(
                params: PaginateParams, qb: SelectQueryBuilder<T>, orderBy: string, customOrderMapping: any
            ): Promise<PaginateResults<T>>,
            getPastDateRange(period: string): DateRange,
            getCurrentDateRange(period: string): DateRange
        }
    }
}

const baseUtilsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.decorate('baseUtils', {
        isEmpty(val: any, allowEmptyArrayOrObject?: boolean): boolean {
            if (val == null) {
                return true;
            }

            if (Array.isArray(val)) {
                if (val.length < 1 && !allowEmptyArrayOrObject) {
                    return true;
                }
                return false;
            }

            // lets check for object
            if (val.constructor === Object) {
                if (Object.keys(val).length < 1 && !allowEmptyArrayOrObject) {
                    return true;
                }
                return false;
            }

            if (String(val).trim() == "") {
                return true;
            }

            return false;
        },
        applyFilter<T extends ObjectLiteral>(
            filters: string,
            filterMap: any,
            qb: SelectQueryBuilder<T>,
            filterRestrictions: FilterRestrictions = {}
        ): SelectQueryBuilder<T> {
            if (!filters) {
                return qb;
            }

            const splitFilters = filters.split(';');

            const processedFilterNames: any = {};

            for (const filterSection of splitFilters) {
                // TODO what if we need to have value with equals sign in it ? oO
                const filterParts = filterSection.split('=', 2);
                const filterName = filterParts[0];
                let filterValue = filterParts[1];

                if (filterRestrictions[filterName] && (
                    filterRestrictions[filterName].defaultIfEmptyOrIncorrect === null ||
                    filterRestrictions[filterName].defaultIfEmptyOrIncorrect === undefined
                )) {
                    throw fastify.httpErrors.badRequest('Restrictions configured for selection criteria but mandatory default value is null or undefined');
                }

                if (!filterMap[filterName]) {
                    continue;
                }

                if (filterParts.length != 2 || fastify.baseUtils.isEmpty(filterValue)) {
                    if (!filterRestrictions || !filterRestrictions[filterName]) {
                        continue;
                    }

                    filterValue = filterRestrictions[filterName].defaultIfEmptyOrIncorrect;
                }

                processedFilterNames[filterName] = true;
                qb = fastify.baseUtils.applyFilterSection(filterName, filterValue, filterMap, qb, filterRestrictions);
            }

            qb = Object.keys(filterRestrictions).reduce((result, restrictedFilterName) => {
                if (!processedFilterNames[restrictedFilterName]) {
                    result = fastify.baseUtils.applyFilterSection(
                        restrictedFilterName, filterRestrictions[restrictedFilterName].defaultIfEmptyOrIncorrect,
                        filterMap, qb, filterRestrictions);
                }

                return result;
            }, qb);

            return qb;
        },
        applyFilterSection<T extends ObjectLiteral>(
            filterName: string,
            filterValue: string,
            filterMap: any,
            qb: SelectQueryBuilder<T>,
            filterRestrictions: FilterRestrictions = {}
        ): SelectQueryBuilder<T> {
            const filterParams = filterMap[filterName];
            const type = filterParams.type;
            const op = filterParams.op || '=';
            const transform = filterParams.transform;
            let columns = filterParams.column;

            if (!Array.isArray(columns)) {
                columns = [columns];
            }

            filterValue = filterValue.trim();

            if (transform) {
               filterValue = filterValue.toLowerCase();
            }

            if (filterRestrictions && filterRestrictions[filterName] && Array.isArray(filterRestrictions[filterName].allowedValues)) {
                // Check if value is allowed and replace if not or empty
                if (!filterRestrictions[filterName].allowedValues.some(v => v === filterValue)) {
                    filterValue = filterRestrictions[filterName].defaultIfEmptyOrIncorrect;
                }
            }

            const varName = 'filter_' + filterName;
            const varObject: any = {};

            if (type == 'DATE') {
                let dateString = filterValue;

                if (filterParams.params && filterParams.params.defaultTime) {
                    dateString += ' ' + filterParams.params.defaultTime;
                }

                varObject[varName] = new Date(dateString);
            }
            else if (op == 'LIKE') {
                varObject[varName] = `%${filterValue}%`;
            } else if (op == 'IN') { 
                const valueArray = filterValue.split(','); 
                varObject[varName] = valueArray;
            } else {
                varObject[varName] = `${filterValue}`;
            }

            let andSql = '';
            for (const column of columns) {
                if (andSql != '') {
                    andSql += ' OR '
                }
                if (op === 'IN') {
                    andSql += `${column} IN (:...${varName})`;
                }
                else {
                    andSql += transform? `LOWER(${column}) ${op} :${varName}` : `${column} ${op} :${varName}`;
                }
            }
 
            qb.andWhere(`(${andSql})`, varObject); 
            return qb;
        },
        async getManyPaginateResults<T extends ObjectLiteral>({ params, query, defaultOrderBy, customOrderMapping }: { params: PaginateParams, query: SelectQueryBuilder<T>, defaultOrderBy?: string, customOrderMapping?: any }): Promise<PaginateResults<T>> {
            const count = await query.getCount();

            if (params.skip != null && params.take != null) {
                if (params.skip > 0) {
                    query.skip(params.skip * params.take);
                }
            }
            if (params.take != null) {
                query.take(params.take);
            }

            const sort = params?.sort || 'DESC';

            if (params.orderBy) {
                if (customOrderMapping && customOrderMapping[params.orderBy]) {
                    query.orderBy(customOrderMapping[params.orderBy], sort);
                } else {
                    query.orderBy(query.alias + '.' + params.orderBy, sort);
                }
            }
            else if (defaultOrderBy) {
                query.orderBy(defaultOrderBy, sort);
            }

            const result: T[] = await query.getMany();
            return { list: result, count: count };
        },
        async getPaginateResults<T extends ObjectLiteral>(params: PaginateParams, qb: SelectQueryBuilder<T>, orderBy: string = "createdDate", customOrderMapping: any = null): Promise<PaginateResults<T>> {
            const count = await qb.getCount();

            if (params.skip != null && params.take != null) {
                qb.offset(params.skip * params.take);
            }
            if (params.take != null) {
                qb.limit(params.take);
            }

            let sort: "ASC" | "DESC" = 'DESC';
            if (params.sort) {
                sort = params.sort;
            }
            if (params.orderBy) {
                if (customOrderMapping && customOrderMapping[params.orderBy]) {
                    qb.orderBy(customOrderMapping[params.orderBy], sort);
                } else {
                    qb.orderBy(qb.alias + '.' + params.orderBy, sort);
                }
            } else {
                qb.orderBy(orderBy, sort);
            }

            const result: T[] = await qb.getRawMany();
            return { list: result, count: count };
        },
        getPastDateRange(period: string): DateRange {
            switch (period) {
                case '1d':
                    return {
                        dateForm: moment().subtract(1, 'days').startOf('day').utc().format(),
                        dateTo: moment().subtract(1, 'days').endOf('day').utc().format()
                    };
                case '1w':
                    return {
                        dateForm: moment().subtract(1, 'weeks').startOf('isoWeek').toDate(),
                        dateTo: moment().subtract(1, 'weeks').endOf('isoWeek').toDate()
                    };
                case '1m':
                    return {
                        dateForm: moment().subtract(1, 'month').startOf('month').toDate(),
                        dateTo: moment().subtract(1, 'month').endOf('month').toDate()
                    };
                case '1y':
                    return {
                        dateForm: moment().subtract(1, 'year').startOf('year').toDate(),
                        dateTo: moment().subtract(1, 'year').endOf('year').toDate()
                    };
                default:
                    throw fastify.httpErrors.badRequest('Invalid period');
            }
        },
        getCurrentDateRange(period: string): DateRange {
            switch (period) {
                case '1d':
                    return {
                        dateForm: new Date(moment().startOf('day').utc().format()),
                        dateTo: new Date(moment().endOf('day').utc().format())
                    };
                case '1w':
                    return {
                        dateForm: new Date(moment().startOf('isoWeek').toDate()),
                        dateTo: new Date(moment().endOf('isoWeek').toDate())
                    };
                case '1m':
                    return {
                        dateForm: new Date(moment().startOf('month').toDate()),
                        dateTo: new Date(moment().endOf('month').toDate())
                    };
                case '1y':
                    return {
                        dateForm: new Date(moment().startOf('year').toDate()),
                        dateTo: new Date(moment().endOf('year').toDate())
                    };
                default:
                    throw fastify.httpErrors.badRequest('Invalid period');
            }
        },
    })
}

export default fp(baseUtilsPlugin, { name: 'baseUtils' });
