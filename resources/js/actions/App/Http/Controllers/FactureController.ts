import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\FactureController::index
 * @see app/Http/Controllers/FactureController.php:26
 * @route '/factures'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/factures',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::index
 * @see app/Http/Controllers/FactureController.php:26
 * @route '/factures'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::index
 * @see app/Http/Controllers/FactureController.php:26
 * @route '/factures'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::index
 * @see app/Http/Controllers/FactureController.php:26
 * @route '/factures'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FactureController::boutiqueHistory
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
export const boutiqueHistory = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: boutiqueHistory.url(args, options),
    method: 'get',
})

boutiqueHistory.definition = {
    methods: ["get","head"],
    url: '/factures/boutique/{boutique}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::boutiqueHistory
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
boutiqueHistory.url = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { boutique: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { boutique: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    boutique: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        boutique: typeof args.boutique === 'object'
                ? args.boutique.id
                : args.boutique,
                }

    return boutiqueHistory.definition.url
            .replace('{boutique}', parsedArgs.boutique.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::boutiqueHistory
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
boutiqueHistory.get = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: boutiqueHistory.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::boutiqueHistory
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
boutiqueHistory.head = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: boutiqueHistory.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FactureController::create
 * @see app/Http/Controllers/FactureController.php:92
 * @route '/factures/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/factures/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::create
 * @see app/Http/Controllers/FactureController.php:92
 * @route '/factures/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::create
 * @see app/Http/Controllers/FactureController.php:92
 * @route '/factures/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::create
 * @see app/Http/Controllers/FactureController.php:92
 * @route '/factures/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FactureController::store
 * @see app/Http/Controllers/FactureController.php:107
 * @route '/factures'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/factures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FactureController::store
 * @see app/Http/Controllers/FactureController.php:107
 * @route '/factures'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::store
 * @see app/Http/Controllers/FactureController.php:107
 * @route '/factures'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\FactureController::show
 * @see app/Http/Controllers/FactureController.php:146
 * @route '/factures/{facture}'
 */
export const show = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/factures/{facture}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::show
 * @see app/Http/Controllers/FactureController.php:146
 * @route '/factures/{facture}'
 */
show.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return show.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::show
 * @see app/Http/Controllers/FactureController.php:146
 * @route '/factures/{facture}'
 */
show.get = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::show
 * @see app/Http/Controllers/FactureController.php:146
 * @route '/factures/{facture}'
 */
show.head = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FactureController::pdf
 * @see app/Http/Controllers/FactureController.php:168
 * @route '/factures/{facture}/pdf'
 */
export const pdf = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/factures/{facture}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::pdf
 * @see app/Http/Controllers/FactureController.php:168
 * @route '/factures/{facture}/pdf'
 */
pdf.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return pdf.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::pdf
 * @see app/Http/Controllers/FactureController.php:168
 * @route '/factures/{facture}/pdf'
 */
pdf.get = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::pdf
 * @see app/Http/Controllers/FactureController.php:168
 * @route '/factures/{facture}/pdf'
 */
pdf.head = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FactureController::validateFacture
 * @see app/Http/Controllers/FactureController.php:201
 * @route '/factures/{facture}/validate'
 */
export const validateFacture = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: validateFacture.url(args, options),
    method: 'put',
})

validateFacture.definition = {
    methods: ["put"],
    url: '/factures/{facture}/validate',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\FactureController::validateFacture
 * @see app/Http/Controllers/FactureController.php:201
 * @route '/factures/{facture}/validate'
 */
validateFacture.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return validateFacture.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::validateFacture
 * @see app/Http/Controllers/FactureController.php:201
 * @route '/factures/{facture}/validate'
 */
validateFacture.put = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: validateFacture.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\FactureController::pay
 * @see app/Http/Controllers/FactureController.php:220
 * @route '/factures/{facture}/pay'
 */
export const pay = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: pay.url(args, options),
    method: 'put',
})

pay.definition = {
    methods: ["put"],
    url: '/factures/{facture}/pay',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\FactureController::pay
 * @see app/Http/Controllers/FactureController.php:220
 * @route '/factures/{facture}/pay'
 */
pay.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return pay.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::pay
 * @see app/Http/Controllers/FactureController.php:220
 * @route '/factures/{facture}/pay'
 */
pay.put = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: pay.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\FactureController::cancel
 * @see app/Http/Controllers/FactureController.php:238
 * @route '/factures/{facture}/cancel'
 */
export const cancel = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

cancel.definition = {
    methods: ["put"],
    url: '/factures/{facture}/cancel',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\FactureController::cancel
 * @see app/Http/Controllers/FactureController.php:238
 * @route '/factures/{facture}/cancel'
 */
cancel.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return cancel.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::cancel
 * @see app/Http/Controllers/FactureController.php:238
 * @route '/factures/{facture}/cancel'
 */
cancel.put = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cancel.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\FactureController::destroy
 * @see app/Http/Controllers/FactureController.php:255
 * @route '/factures/{facture}'
 */
export const destroy = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/factures/{facture}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\FactureController::destroy
 * @see app/Http/Controllers/FactureController.php:255
 * @route '/factures/{facture}'
 */
destroy.url = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { facture: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { facture: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    facture: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        facture: typeof args.facture === 'object'
                ? args.facture.id
                : args.facture,
                }

    return destroy.definition.url
            .replace('{facture}', parsedArgs.facture.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::destroy
 * @see app/Http/Controllers/FactureController.php:255
 * @route '/factures/{facture}'
 */
destroy.delete = (args: { facture: number | { id: number } } | [facture: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const FactureController = { index, boutiqueHistory, create, store, show, pdf, validateFacture, pay, cancel, destroy }

export default FactureController