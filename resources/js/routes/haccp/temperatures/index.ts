import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/haccp/temperatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const temperatures = {
    store: Object.assign(store, store),
}

export default temperatures