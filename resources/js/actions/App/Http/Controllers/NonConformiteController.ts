import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\NonConformiteController::index
 * @see app/Http/Controllers/NonConformiteController.php:16
 * @route '/nonconformites'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/nonconformites',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NonConformiteController::index
 * @see app/Http/Controllers/NonConformiteController.php:16
 * @route '/nonconformites'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NonConformiteController::index
 * @see app/Http/Controllers/NonConformiteController.php:16
 * @route '/nonconformites'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NonConformiteController::index
 * @see app/Http/Controllers/NonConformiteController.php:16
 * @route '/nonconformites'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NonConformiteController::store
 * @see app/Http/Controllers/NonConformiteController.php:36
 * @route '/nonconformites'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/nonconformites',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NonConformiteController::store
 * @see app/Http/Controllers/NonConformiteController.php:36
 * @route '/nonconformites'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NonConformiteController::store
 * @see app/Http/Controllers/NonConformiteController.php:36
 * @route '/nonconformites'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NonConformiteController::update
 * @see app/Http/Controllers/NonConformiteController.php:62
 * @route '/nonconformites/{nc}'
 */
export const update = (args: { nc: number | { id: number } } | [nc: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/nonconformites/{nc}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\NonConformiteController::update
 * @see app/Http/Controllers/NonConformiteController.php:62
 * @route '/nonconformites/{nc}'
 */
update.url = (args: { nc: number | { id: number } } | [nc: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nc: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { nc: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    nc: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        nc: typeof args.nc === 'object'
                ? args.nc.id
                : args.nc,
                }

    return update.definition.url
            .replace('{nc}', parsedArgs.nc.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NonConformiteController::update
 * @see app/Http/Controllers/NonConformiteController.php:62
 * @route '/nonconformites/{nc}'
 */
update.put = (args: { nc: number | { id: number } } | [nc: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
const NonConformiteController = { index, store, update }

export default NonConformiteController