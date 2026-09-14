import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CommandeUrgenteController::index
 * @see app/Http/Controllers/CommandeUrgenteController.php:26
 * @route '/commandes-urgentes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/commandes-urgentes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::index
 * @see app/Http/Controllers/CommandeUrgenteController.php:26
 * @route '/commandes-urgentes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::index
 * @see app/Http/Controllers/CommandeUrgenteController.php:26
 * @route '/commandes-urgentes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CommandeUrgenteController::index
 * @see app/Http/Controllers/CommandeUrgenteController.php:26
 * @route '/commandes-urgentes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::create
 * @see app/Http/Controllers/CommandeUrgenteController.php:93
 * @route '/commandes-urgentes/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/commandes-urgentes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::create
 * @see app/Http/Controllers/CommandeUrgenteController.php:93
 * @route '/commandes-urgentes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::create
 * @see app/Http/Controllers/CommandeUrgenteController.php:93
 * @route '/commandes-urgentes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CommandeUrgenteController::create
 * @see app/Http/Controllers/CommandeUrgenteController.php:93
 * @route '/commandes-urgentes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::store
 * @see app/Http/Controllers/CommandeUrgenteController.php:113
 * @route '/commandes-urgentes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/commandes-urgentes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::store
 * @see app/Http/Controllers/CommandeUrgenteController.php:113
 * @route '/commandes-urgentes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::store
 * @see app/Http/Controllers/CommandeUrgenteController.php:113
 * @route '/commandes-urgentes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::take
 * @see app/Http/Controllers/CommandeUrgenteController.php:148
 * @route '/commandes-urgentes/{commande}/take'
 */
export const take = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: take.url(args, options),
    method: 'post',
})

take.definition = {
    methods: ["post"],
    url: '/commandes-urgentes/{commande}/take',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::take
 * @see app/Http/Controllers/CommandeUrgenteController.php:148
 * @route '/commandes-urgentes/{commande}/take'
 */
take.url = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { commande: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    commande: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        commande: args.commande,
                }

    return take.definition.url
            .replace('{commande}', parsedArgs.commande.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::take
 * @see app/Http/Controllers/CommandeUrgenteController.php:148
 * @route '/commandes-urgentes/{commande}/take'
 */
take.post = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: take.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::status
 * @see app/Http/Controllers/CommandeUrgenteController.php:168
 * @route '/commandes-urgentes/{commande}/status'
 */
export const status = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: status.url(args, options),
    method: 'post',
})

status.definition = {
    methods: ["post"],
    url: '/commandes-urgentes/{commande}/status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::status
 * @see app/Http/Controllers/CommandeUrgenteController.php:168
 * @route '/commandes-urgentes/{commande}/status'
 */
status.url = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { commande: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    commande: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        commande: args.commande,
                }

    return status.definition.url
            .replace('{commande}', parsedArgs.commande.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::status
 * @see app/Http/Controllers/CommandeUrgenteController.php:168
 * @route '/commandes-urgentes/{commande}/status'
 */
status.post = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: status.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::createBl
 * @see app/Http/Controllers/CommandeUrgenteController.php:194
 * @route '/commandes-urgentes/{commande}/create-bl'
 */
export const createBl = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createBl.url(args, options),
    method: 'get',
})

createBl.definition = {
    methods: ["get","head"],
    url: '/commandes-urgentes/{commande}/create-bl',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::createBl
 * @see app/Http/Controllers/CommandeUrgenteController.php:194
 * @route '/commandes-urgentes/{commande}/create-bl'
 */
createBl.url = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { commande: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    commande: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        commande: args.commande,
                }

    return createBl.definition.url
            .replace('{commande}', parsedArgs.commande.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::createBl
 * @see app/Http/Controllers/CommandeUrgenteController.php:194
 * @route '/commandes-urgentes/{commande}/create-bl'
 */
createBl.get = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createBl.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CommandeUrgenteController::createBl
 * @see app/Http/Controllers/CommandeUrgenteController.php:194
 * @route '/commandes-urgentes/{commande}/create-bl'
 */
createBl.head = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: createBl.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CommandeUrgenteController::show
 * @see app/Http/Controllers/CommandeUrgenteController.php:232
 * @route '/commandes-urgentes/{commande}'
 */
export const show = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/commandes-urgentes/{commande}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CommandeUrgenteController::show
 * @see app/Http/Controllers/CommandeUrgenteController.php:232
 * @route '/commandes-urgentes/{commande}'
 */
show.url = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { commande: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    commande: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        commande: args.commande,
                }

    return show.definition.url
            .replace('{commande}', parsedArgs.commande.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommandeUrgenteController::show
 * @see app/Http/Controllers/CommandeUrgenteController.php:232
 * @route '/commandes-urgentes/{commande}'
 */
show.get = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CommandeUrgenteController::show
 * @see app/Http/Controllers/CommandeUrgenteController.php:232
 * @route '/commandes-urgentes/{commande}'
 */
show.head = (args: { commande: string | number } | [commande: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})
const commandesUrgentes = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
take: Object.assign(take, take),
status: Object.assign(status, status),
createBl: Object.assign(createBl, createBl),
show: Object.assign(show, show),
}

export default commandesUrgentes