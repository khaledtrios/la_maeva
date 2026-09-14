import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
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
const entree = {
    store: Object.assign(store, store),
}

export default entree