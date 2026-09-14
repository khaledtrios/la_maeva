import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:616
 * @route '/returns/{productReturn}/photos'
 */
export const store = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/returns/{productReturn}/photos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:616
 * @route '/returns/{productReturn}/photos'
 */
store.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productReturn: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productReturn: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productReturn: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productReturn: typeof args.productReturn === 'object'
                ? args.productReturn.id
                : args.productReturn,
                }

    return store.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:616
 * @route '/returns/{productReturn}/photos'
 */
store.post = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:634
 * @route '/returns/photos/{photo}'
 */
export const destroy = (args: { photo: number | { id: number } } | [photo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/returns/photos/{photo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:634
 * @route '/returns/photos/{photo}'
 */
destroy.url = (args: { photo: number | { id: number } } | [photo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { photo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { photo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    photo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        photo: typeof args.photo === 'object'
                ? args.photo.id
                : args.photo,
                }

    return destroy.definition.url
            .replace('{photo}', parsedArgs.photo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:634
 * @route '/returns/photos/{photo}'
 */
destroy.delete = (args: { photo: number | { id: number } } | [photo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const photos = {
    store: Object.assign(store, store),
destroy: Object.assign(destroy, destroy),
}

export default photos