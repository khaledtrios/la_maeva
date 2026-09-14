import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/haccp/receptions-fournisseurs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const receptionsFournisseurs = {
    store: Object.assign(store, store),
}

export default receptionsFournisseurs