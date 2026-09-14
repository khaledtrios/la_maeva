import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:19
 * @route '/admin'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:19
 * @route '/admin'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:19
 * @route '/admin'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:19
 * @route '/admin'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AdminController::storeEntity
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
export const storeEntity = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEntity.url(options),
    method: 'post',
})

storeEntity.definition = {
    methods: ["post"],
    url: '/admin/entities',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::storeEntity
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
storeEntity.url = (options?: RouteQueryOptions) => {
    return storeEntity.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::storeEntity
 * @see app/Http/Controllers/AdminController.php:61
 * @route '/admin/entities'
 */
storeEntity.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEntity.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdminController::updateEntity
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
export const updateEntity = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateEntity.url(args, options),
    method: 'put',
})

updateEntity.definition = {
    methods: ["put"],
    url: '/admin/entities/{entity}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AdminController::updateEntity
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
updateEntity.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateEntity.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::updateEntity
 * @see app/Http/Controllers/AdminController.php:74
 * @route '/admin/entities/{entity}'
 */
updateEntity.put = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateEntity.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AdminController::uploadEntityLogo
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
export const uploadEntityLogo = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadEntityLogo.url(args, options),
    method: 'post',
})

uploadEntityLogo.definition = {
    methods: ["post"],
    url: '/admin/entities/{entity}/logo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::uploadEntityLogo
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
uploadEntityLogo.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return uploadEntityLogo.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::uploadEntityLogo
 * @see app/Http/Controllers/AdminController.php:90
 * @route '/admin/entities/{entity}/logo'
 */
uploadEntityLogo.post = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadEntityLogo.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdminController::deleteEntityLogo
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
export const deleteEntityLogo = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteEntityLogo.url(args, options),
    method: 'delete',
})

deleteEntityLogo.definition = {
    methods: ["delete"],
    url: '/admin/entities/{entity}/logo',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdminController::deleteEntityLogo
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
deleteEntityLogo.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return deleteEntityLogo.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::deleteEntityLogo
 * @see app/Http/Controllers/AdminController.php:110
 * @route '/admin/entities/{entity}/logo'
 */
deleteEntityLogo.delete = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteEntityLogo.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AdminController::destroyEntity
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
export const destroyEntity = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyEntity.url(args, options),
    method: 'delete',
})

destroyEntity.definition = {
    methods: ["delete"],
    url: '/admin/entities/{entity}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdminController::destroyEntity
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
destroyEntity.url = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroyEntity.definition.url
            .replace('{entity}', parsedArgs.entity.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::destroyEntity
 * @see app/Http/Controllers/AdminController.php:120
 * @route '/admin/entities/{entity}'
 */
destroyEntity.delete = (args: { entity: number | { id: number } } | [entity: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyEntity.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AdminController::storeUser
 * @see app/Http/Controllers/AdminController.php:143
 * @route '/admin/users'
 */
export const storeUser = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeUser.url(options),
    method: 'post',
})

storeUser.definition = {
    methods: ["post"],
    url: '/admin/users',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::storeUser
 * @see app/Http/Controllers/AdminController.php:143
 * @route '/admin/users'
 */
storeUser.url = (options?: RouteQueryOptions) => {
    return storeUser.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::storeUser
 * @see app/Http/Controllers/AdminController.php:143
 * @route '/admin/users'
 */
storeUser.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeUser.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdminController::updateUser
 * @see app/Http/Controllers/AdminController.php:160
 * @route '/admin/users/{user}'
 */
export const updateUser = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateUser.url(args, options),
    method: 'put',
})

updateUser.definition = {
    methods: ["put"],
    url: '/admin/users/{user}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AdminController::updateUser
 * @see app/Http/Controllers/AdminController.php:160
 * @route '/admin/users/{user}'
 */
updateUser.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return updateUser.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::updateUser
 * @see app/Http/Controllers/AdminController.php:160
 * @route '/admin/users/{user}'
 */
updateUser.put = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateUser.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\AdminController::destroyUser
 * @see app/Http/Controllers/AdminController.php:182
 * @route '/admin/users/{user}'
 */
export const destroyUser = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyUser.url(args, options),
    method: 'delete',
})

destroyUser.definition = {
    methods: ["delete"],
    url: '/admin/users/{user}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdminController::destroyUser
 * @see app/Http/Controllers/AdminController.php:182
 * @route '/admin/users/{user}'
 */
destroyUser.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return destroyUser.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::destroyUser
 * @see app/Http/Controllers/AdminController.php:182
 * @route '/admin/users/{user}'
 */
destroyUser.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyUser.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AdminController::factureSettings
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
export const factureSettings = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: factureSettings.url(options),
    method: 'get',
})

factureSettings.definition = {
    methods: ["get","head"],
    url: '/admin/facture-settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdminController::factureSettings
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
factureSettings.url = (options?: RouteQueryOptions) => {
    return factureSettings.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::factureSettings
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
factureSettings.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: factureSettings.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdminController::factureSettings
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
factureSettings.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: factureSettings.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AdminController::toggleAutoGeneration
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
export const toggleAutoGeneration = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleAutoGeneration.url(options),
    method: 'post',
})

toggleAutoGeneration.definition = {
    methods: ["post"],
    url: '/admin/facture-settings/toggle-auto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::toggleAutoGeneration
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
toggleAutoGeneration.url = (options?: RouteQueryOptions) => {
    return toggleAutoGeneration.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::toggleAutoGeneration
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
toggleAutoGeneration.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleAutoGeneration.url(options),
    method: 'post',
})
const AdminController = { index, storeEntity, updateEntity, uploadEntityLogo, deleteEntityLogo, destroyEntity, storeUser, updateUser, destroyUser, factureSettings, toggleAutoGeneration }

export default AdminController