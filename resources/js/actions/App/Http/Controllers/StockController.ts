import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StockController::index
 * @see app/Http/Controllers/StockController.php:21
 * @route '/stock'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockController::index
 * @see app/Http/Controllers/StockController.php:21
 * @route '/stock'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockController::index
 * @see app/Http/Controllers/StockController.php:21
 * @route '/stock'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockController::index
 * @see app/Http/Controllers/StockController.php:21
 * @route '/stock'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockController::adjust
 * @see app/Http/Controllers/StockController.php:171
 * @route '/stock/adjust'
 */
export const adjust = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(options),
    method: 'post',
})

adjust.definition = {
    methods: ["post"],
    url: '/stock/adjust',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockController::adjust
 * @see app/Http/Controllers/StockController.php:171
 * @route '/stock/adjust'
 */
adjust.url = (options?: RouteQueryOptions) => {
    return adjust.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockController::adjust
 * @see app/Http/Controllers/StockController.php:171
 * @route '/stock/adjust'
 */
adjust.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\StockController::movements
 * @see app/Http/Controllers/StockController.php:256
 * @route '/stock/movements'
 */
export const movements = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movements.url(options),
    method: 'get',
})

movements.definition = {
    methods: ["get","head"],
    url: '/stock/movements',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockController::movements
 * @see app/Http/Controllers/StockController.php:256
 * @route '/stock/movements'
 */
movements.url = (options?: RouteQueryOptions) => {
    return movements.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockController::movements
 * @see app/Http/Controllers/StockController.php:256
 * @route '/stock/movements'
 */
movements.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movements.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockController::movements
 * @see app/Http/Controllers/StockController.php:256
 * @route '/stock/movements'
 */
movements.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movements.url(options),
    method: 'head',
})
const StockController = { index, adjust, movements }

export default StockController