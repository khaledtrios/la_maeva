import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductionController::index
 * @see app/Http/Controllers/ProductionController.php:30
 * @route '/production'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/production',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductionController::index
 * @see app/Http/Controllers/ProductionController.php:30
 * @route '/production'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::index
 * @see app/Http/Controllers/ProductionController.php:30
 * @route '/production'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductionController::index
 * @see app/Http/Controllers/ProductionController.php:30
 * @route '/production'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductionController::store
 * @see app/Http/Controllers/ProductionController.php:284
 * @route '/production'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/production',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductionController::store
 * @see app/Http/Controllers/ProductionController.php:284
 * @route '/production'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::store
 * @see app/Http/Controllers/ProductionController.php:284
 * @route '/production'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductionController::update
 * @see app/Http/Controllers/ProductionController.php:351
 * @route '/production/{production}'
 */
export const update = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/production/{production}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProductionController::update
 * @see app/Http/Controllers/ProductionController.php:351
 * @route '/production/{production}'
 */
update.url = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { production: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { production: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    production: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        production: typeof args.production === 'object'
                ? args.production.id
                : args.production,
                }

    return update.definition.url
            .replace('{production}', parsedArgs.production.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::update
 * @see app/Http/Controllers/ProductionController.php:351
 * @route '/production/{production}'
 */
update.put = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductionController::destroy
 * @see app/Http/Controllers/ProductionController.php:374
 * @route '/production/{production}'
 */
export const destroy = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/production/{production}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductionController::destroy
 * @see app/Http/Controllers/ProductionController.php:374
 * @route '/production/{production}'
 */
destroy.url = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { production: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { production: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    production: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        production: typeof args.production === 'object'
                ? args.production.id
                : args.production,
                }

    return destroy.definition.url
            .replace('{production}', parsedArgs.production.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::destroy
 * @see app/Http/Controllers/ProductionController.php:374
 * @route '/production/{production}'
 */
destroy.delete = (args: { production: number | { id: number } } | [production: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductionController::batch
 * @see app/Http/Controllers/ProductionController.php:499
 * @route '/production/batch'
 */
export const batch = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batch.url(options),
    method: 'post',
})

batch.definition = {
    methods: ["post"],
    url: '/production/batch',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductionController::batch
 * @see app/Http/Controllers/ProductionController.php:499
 * @route '/production/batch'
 */
batch.url = (options?: RouteQueryOptions) => {
    return batch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::batch
 * @see app/Http/Controllers/ProductionController.php:499
 * @route '/production/batch'
 */
batch.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batch.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductionController::distribuer
 * @see app/Http/Controllers/ProductionController.php:392
 * @route '/production/distribuer'
 */
export const distribuer = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: distribuer.url(options),
    method: 'post',
})

distribuer.definition = {
    methods: ["post"],
    url: '/production/distribuer',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductionController::distribuer
 * @see app/Http/Controllers/ProductionController.php:392
 * @route '/production/distribuer'
 */
distribuer.url = (options?: RouteQueryOptions) => {
    return distribuer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductionController::distribuer
 * @see app/Http/Controllers/ProductionController.php:392
 * @route '/production/distribuer'
 */
distribuer.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: distribuer.url(options),
    method: 'post',
})
const ProductionController = { index, store, update, destroy, batch, distribuer }

export default ProductionController