import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AdminController::upload
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
export const upload = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(args, options),
    method: 'post',
})

upload.definition = {
    methods: ["post"],
    url: '/admin/entities/{entity}/logo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::upload
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
upload.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entity: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entity: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entity: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entity: typeof args.entity === 'object'
                ? args.entity.id
                : args.entity,
                }

    return upload.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::upload
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
upload.post = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdminController::deleteMethod
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
export const deleteMethod = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})

deleteMethod.definition = {
    methods: ["delete"],
    url: '/admin/entities/{entity}/logo',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdminController::deleteMethod
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
deleteMethod.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entity: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entity: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entity: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entity: typeof args.entity === 'object'
                ? args.entity.id
                : args.entity,
                }

    return deleteMethod.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::deleteMethod
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
deleteMethod.delete = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})
const logo = {
    upload: Object.assign(upload, upload),
delete: Object.assign(deleteMethod, deleteMethod),
}

export default logo