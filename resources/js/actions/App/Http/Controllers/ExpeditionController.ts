import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ExpeditionController::index
 * @see app/Http/Controllers/ExpeditionController.php:23
 * @route '/expeditions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/expeditions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpeditionController::index
 * @see app/Http/Controllers/ExpeditionController.php:23
 * @route '/expeditions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExpeditionController::index
 * @see app/Http/Controllers/ExpeditionController.php:23
 * @route '/expeditions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ExpeditionController::index
 * @see app/Http/Controllers/ExpeditionController.php:23
 * @route '/expeditions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpeditionController::show
 * @see app/Http/Controllers/ExpeditionController.php:126
 * @route '/expeditions/{expedition}'
 */
export const show = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/expeditions/{expedition}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpeditionController::show
 * @see app/Http/Controllers/ExpeditionController.php:126
 * @route '/expeditions/{expedition}'
 */
show.url = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { expedition: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { expedition: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    expedition: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        expedition: typeof args.expedition === 'object'
                ? args.expedition.id
                : args.expedition,
                }

    return show.definition.url
            .replace('{expedition}', parsedArgs.expedition.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExpeditionController::show
 * @see app/Http/Controllers/ExpeditionController.php:126
 * @route '/expeditions/{expedition}'
 */
show.get = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ExpeditionController::show
 * @see app/Http/Controllers/ExpeditionController.php:126
 * @route '/expeditions/{expedition}'
 */
show.head = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpeditionController::store
 * @see app/Http/Controllers/ExpeditionController.php:152
 * @route '/expeditions'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/expeditions',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExpeditionController::store
 * @see app/Http/Controllers/ExpeditionController.php:152
 * @route '/expeditions'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExpeditionController::store
 * @see app/Http/Controllers/ExpeditionController.php:152
 * @route '/expeditions'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpeditionController::updateStatus
 * @see app/Http/Controllers/ExpeditionController.php:224
 * @route '/expeditions/{expedition}/status'
 */
export const updateStatus = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})

updateStatus.definition = {
    methods: ["put"],
    url: '/expeditions/{expedition}/status',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ExpeditionController::updateStatus
 * @see app/Http/Controllers/ExpeditionController.php:224
 * @route '/expeditions/{expedition}/status'
 */
updateStatus.url = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { expedition: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { expedition: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    expedition: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        expedition: typeof args.expedition === 'object'
                ? args.expedition.id
                : args.expedition,
                }

    return updateStatus.definition.url
            .replace('{expedition}', parsedArgs.expedition.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ExpeditionController::updateStatus
 * @see app/Http/Controllers/ExpeditionController.php:224
 * @route '/expeditions/{expedition}/status'
 */
updateStatus.put = (args: { expedition: number | { id: number } } | [expedition: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateStatus.url(args, options),
    method: 'put',
})
const ExpeditionController = { index, show, store, updateStatus }

export default ExpeditionController