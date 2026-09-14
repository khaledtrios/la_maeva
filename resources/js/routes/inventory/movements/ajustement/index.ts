import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/movements/ajustement',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StockMovementController::store
 * @see app/Http/Controllers/StockMovementController.php:148
 * @route '/inventory/movements/ajustement'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const ajustement = {
    store: Object.assign(store, store),
}

export default ajustement