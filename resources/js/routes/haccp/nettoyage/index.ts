import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/haccp/nettoyage',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::store
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HaccpController::update
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
export const update = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/haccp/nettoyage/{nettoyage}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\HaccpController::update
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
update.url = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nettoyage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { nettoyage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    nettoyage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        nettoyage: typeof args.nettoyage === 'object'
                ? args.nettoyage.id
                : args.nettoyage,
                }

    return update.definition.url
            .replace('{nettoyage}', parsedArgs.nettoyage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::update
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
update.put = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
const nettoyage = {
    store: Object.assign(store, store),
update: Object.assign(update, update),
}

export default nettoyage