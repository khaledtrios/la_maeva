import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import entree from './entree'
import ajustement from './ajustement'
/**
* @see \App\Http\Controllers\StockMovementController::index
 * @see app/Http/Controllers/StockMovementController.php:20
 * @route '/inventory/movements'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory/movements',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockMovementController::index
 * @see app/Http/Controllers/StockMovementController.php:20
 * @route '/inventory/movements'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::index
 * @see app/Http/Controllers/StockMovementController.php:20
 * @route '/inventory/movements'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockMovementController::index
 * @see app/Http/Controllers/StockMovementController.php:20
 * @route '/inventory/movements'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockMovementController::alerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
export const alerts = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: alerts.url(options),
    method: 'get',
})

alerts.definition = {
    methods: ["get","head"],
    url: '/inventory/movements/alerts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockMovementController::alerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
alerts.url = (options?: RouteQueryOptions) => {
    return alerts.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::alerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
alerts.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: alerts.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockMovementController::alerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
alerts.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: alerts.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockMovementController::balances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
export const balances = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balances.url(args, options),
    method: 'get',
})

balances.definition = {
    methods: ["get","head"],
    url: '/inventory/movements/balances/{ingredient}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockMovementController::balances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
balances.url = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingredient: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    ingredient: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingredient: args.ingredient,
                }

    return balances.definition.url
            .replace('{ingredient}', parsedArgs.ingredient.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::balances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
balances.get = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balances.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockMovementController::balances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
balances.head = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: balances.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockMovementController::previewConsume
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
export const previewConsume = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewConsume.url(options),
    method: 'post',
})

previewConsume.definition = {
    methods: ["post"],
    url: '/inventory/movements/preview-consume',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockMovementController::previewConsume
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
previewConsume.url = (options?: RouteQueryOptions) => {
    return previewConsume.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::previewConsume
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
previewConsume.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewConsume.url(options),
    method: 'post',
})
const movements = {
    index: Object.assign(index, index),
entree: Object.assign(entree, entree),
ajustement: Object.assign(ajustement, ajustement),
alerts: Object.assign(alerts, alerts),
balances: Object.assign(balances, balances),
previewConsume: Object.assign(previewConsume, previewConsume),
}

export default movements