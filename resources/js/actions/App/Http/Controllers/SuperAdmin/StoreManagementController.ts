import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::index
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:17
 * @route '/super-admin/stores'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/super-admin/stores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::index
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:17
 * @route '/super-admin/stores'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::index
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:17
 * @route '/super-admin/stores'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::index
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:17
 * @route '/super-admin/stores'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::approve
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:61
 * @route '/super-admin/stores/{store}/approve'
 */
export const approve = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/super-admin/stores/{store}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::approve
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:61
 * @route '/super-admin/stores/{store}/approve'
 */
approve.url = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { store: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { store: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    store: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        store: typeof args.store === 'object'
                ? args.store.id
                : args.store,
                }

    return approve.definition.url
            .replace('{store}', parsedArgs.store.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::approve
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:61
 * @route '/super-admin/stores/{store}/approve'
 */
approve.post = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reject
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:75
 * @route '/super-admin/stores/{store}/reject'
 */
export const reject = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/super-admin/stores/{store}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reject
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:75
 * @route '/super-admin/stores/{store}/reject'
 */
reject.url = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { store: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { store: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    store: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        store: typeof args.store === 'object'
                ? args.store.id
                : args.store,
                }

    return reject.definition.url
            .replace('{store}', parsedArgs.store.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reject
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:75
 * @route '/super-admin/stores/{store}/reject'
 */
reject.post = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::suspend
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:89
 * @route '/super-admin/stores/{store}/suspend'
 */
export const suspend = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspend.url(args, options),
    method: 'post',
})

suspend.definition = {
    methods: ["post"],
    url: '/super-admin/stores/{store}/suspend',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::suspend
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:89
 * @route '/super-admin/stores/{store}/suspend'
 */
suspend.url = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { store: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { store: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    store: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        store: typeof args.store === 'object'
                ? args.store.id
                : args.store,
                }

    return suspend.definition.url
            .replace('{store}', parsedArgs.store.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::suspend
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:89
 * @route '/super-admin/stores/{store}/suspend'
 */
suspend.post = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspend.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reactivate
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:103
 * @route '/super-admin/stores/{store}/reactivate'
 */
export const reactivate = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(args, options),
    method: 'post',
})

reactivate.definition = {
    methods: ["post"],
    url: '/super-admin/stores/{store}/reactivate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reactivate
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:103
 * @route '/super-admin/stores/{store}/reactivate'
 */
reactivate.url = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { store: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { store: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    store: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        store: typeof args.store === 'object'
                ? args.store.id
                : args.store,
                }

    return reactivate.definition.url
            .replace('{store}', parsedArgs.store.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\StoreManagementController::reactivate
 * @see app/Http/Controllers/SuperAdmin/StoreManagementController.php:103
 * @route '/super-admin/stores/{store}/reactivate'
 */
reactivate.post = (args: { store: number | { id: number } } | [store: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(args, options),
    method: 'post',
})
const StoreManagementController = { index, approve, reject, suspend, reactivate }

export default StoreManagementController