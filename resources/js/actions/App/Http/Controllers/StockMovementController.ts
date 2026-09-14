import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:110
 * @route '/inventory/movements/entree'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/movements/entree',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:110
 * @route '/inventory/movements/entree'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:110
 * @route '/inventory/movements/entree'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\StockMovementController::ajustement
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
export const ajustement = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ajustement.url(options),
    method: 'post',
})

ajustement.definition = {
    methods: ["post"],
    url: '/inventory/movements/ajustement',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockMovementController::ajustement
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
ajustement.url = (options?: RouteQueryOptions) => {
    return ajustement.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::ajustement
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
ajustement.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ajustement.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\StockMovementController::getAlerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
export const getAlerts = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAlerts.url(options),
    method: 'get',
})

getAlerts.definition = {
    methods: ["get","head"],
    url: '/inventory/movements/alerts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockMovementController::getAlerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
getAlerts.url = (options?: RouteQueryOptions) => {
    return getAlerts.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::getAlerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
getAlerts.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAlerts.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockMovementController::getAlerts
 * @see app/Http/Controllers/StockMovementController.php:203
 * @route '/inventory/movements/alerts'
 */
getAlerts.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAlerts.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockMovementController::getBalances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
export const getBalances = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBalances.url(args, options),
    method: 'get',
})

getBalances.definition = {
    methods: ["get","head"],
    url: '/inventory/movements/balances/{ingredient}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StockMovementController::getBalances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
getBalances.url = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return getBalances.definition.url
            .replace('{ingredient}', parsedArgs.ingredient.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::getBalances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
getBalances.get = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBalances.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StockMovementController::getBalances
 * @see app/Http/Controllers/StockMovementController.php:184
 * @route '/inventory/movements/balances/{ingredient}'
 */
getBalances.head = (args: { ingredient: string | number } | [ingredient: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getBalances.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StockMovementController::previewConsumption
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
export const previewConsumption = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewConsumption.url(options),
    method: 'post',
})

previewConsumption.definition = {
    methods: ["post"],
    url: '/inventory/movements/preview-consume',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockMovementController::previewConsumption
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
previewConsumption.url = (options?: RouteQueryOptions) => {
    return previewConsumption.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::previewConsumption
 * @see app/Http/Controllers/StockMovementController.php:234
 * @route '/inventory/movements/preview-consume'
 */
previewConsumption.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewConsumption.url(options),
    method: 'post',
})
const StockMovementController = { index, store, ajustement, getAlerts, getBalances, previewConsumption }

export default StockMovementController