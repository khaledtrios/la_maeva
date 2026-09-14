import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import logo from './logo'
/**
* @see \App\Http\Controllers\AdminController::store
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/entities',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::store
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::store
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdminController::update
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
export const update = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/entities/{entity}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AdminController::update
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
update.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::update
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
update.put = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AdminController::destroy
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
export const destroy = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/entities/{entity}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdminController::destroy
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
destroy.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::destroy
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
destroy.delete = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const entities = {
    store: Object.assign(store, store),
update: Object.assign(update, update),
logo: Object.assign(logo, logo),
destroy: Object.assign(destroy, destroy),
}

export default entities