import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Store\StoreDashboardController::index
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/store/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Store\StoreDashboardController::index
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreDashboardController::index
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Store\StoreDashboardController::index
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const StoreDashboardController = { index }

export default StoreDashboardController