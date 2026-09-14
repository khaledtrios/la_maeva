import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ReportingController::index
 * @see app/Http/Controllers/ReportingController.php:17
 * @route '/reporting'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reporting',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportingController::index
 * @see app/Http/Controllers/ReportingController.php:17
 * @route '/reporting'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportingController::index
 * @see app/Http/Controllers/ReportingController.php:17
 * @route '/reporting'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportingController::index
 * @see app/Http/Controllers/ReportingController.php:17
 * @route '/reporting'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const reporting = {
    index: Object.assign(index, index),
}

export default reporting