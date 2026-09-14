import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import photos from './photos'
/**
* @see \App\Http\Controllers\ReturnController::index
 * @see app/Http/Controllers/ReturnController.php:31
 * @route '/returns'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/returns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReturnController::index
 * @see app/Http/Controllers/ReturnController.php:31
 * @route '/returns'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::index
 * @see app/Http/Controllers/ReturnController.php:31
 * @route '/returns'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReturnController::index
 * @see app/Http/Controllers/ReturnController.php:31
 * @route '/returns'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReturnController::create
 * @see app/Http/Controllers/ReturnController.php:88
 * @route '/returns/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/returns/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReturnController::create
 * @see app/Http/Controllers/ReturnController.php:88
 * @route '/returns/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::create
 * @see app/Http/Controllers/ReturnController.php:88
 * @route '/returns/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReturnController::create
 * @see app/Http/Controllers/ReturnController.php:88
 * @route '/returns/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:171
 * @route '/returns'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/returns',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:171
 * @route '/returns'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::store
 * @see app/Http/Controllers/ReturnController.php:171
 * @route '/returns'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::saisir19h
 * @see app/Http/Controllers/ReturnController.php:683
 * @route '/returns/saisir-19h'
 */
export const saisir19h = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saisir19h.url(options),
    method: 'post',
})

saisir19h.definition = {
    methods: ["post"],
    url: '/returns/saisir-19h',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::saisir19h
 * @see app/Http/Controllers/ReturnController.php:683
 * @route '/returns/saisir-19h'
 */
saisir19h.url = (options?: RouteQueryOptions) => {
    return saisir19h.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::saisir19h
 * @see app/Http/Controllers/ReturnController.php:683
 * @route '/returns/saisir-19h'
 */
saisir19h.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saisir19h.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::show
 * @see app/Http/Controllers/ReturnController.php:337
 * @route '/returns/{productReturn}'
 */
export const show = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/returns/{productReturn}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReturnController::show
 * @see app/Http/Controllers/ReturnController.php:337
 * @route '/returns/{productReturn}'
 */
show.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::show
 * @see app/Http/Controllers/ReturnController.php:337
 * @route '/returns/{productReturn}'
 */
show.get = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReturnController::show
 * @see app/Http/Controllers/ReturnController.php:337
 * @route '/returns/{productReturn}'
 */
show.head = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReturnController::edit
 * @see app/Http/Controllers/ReturnController.php:368
 * @route '/returns/{productReturn}/edit'
 */
export const edit = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/returns/{productReturn}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReturnController::edit
 * @see app/Http/Controllers/ReturnController.php:368
 * @route '/returns/{productReturn}/edit'
 */
edit.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::edit
 * @see app/Http/Controllers/ReturnController.php:368
 * @route '/returns/{productReturn}/edit'
 */
edit.get = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReturnController::edit
 * @see app/Http/Controllers/ReturnController.php:368
 * @route '/returns/{productReturn}/edit'
 */
edit.head = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReturnController::update
 * @see app/Http/Controllers/ReturnController.php:413
 * @route '/returns/{productReturn}'
 */
export const update = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/returns/{productReturn}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ReturnController::update
 * @see app/Http/Controllers/ReturnController.php:413
 * @route '/returns/{productReturn}'
 */
update.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::update
 * @see app/Http/Controllers/ReturnController.php:413
 * @route '/returns/{productReturn}'
 */
update.put = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ReturnController::send
 * @see app/Http/Controllers/ReturnController.php:527
 * @route '/returns/{productReturn}/send'
 */
export const send = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(args, options),
    method: 'post',
})

send.definition = {
    methods: ["post"],
    url: '/returns/{productReturn}/send',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::send
 * @see app/Http/Controllers/ReturnController.php:527
 * @route '/returns/{productReturn}/send'
 */
send.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return send.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::send
 * @see app/Http/Controllers/ReturnController.php:527
 * @route '/returns/{productReturn}/send'
 */
send.post = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::confirm
 * @see app/Http/Controllers/ReturnController.php:536
 * @route '/returns/{productReturn}/confirm'
 */
export const confirm = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(args, options),
    method: 'post',
})

confirm.definition = {
    methods: ["post"],
    url: '/returns/{productReturn}/confirm',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::confirm
 * @see app/Http/Controllers/ReturnController.php:536
 * @route '/returns/{productReturn}/confirm'
 */
confirm.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return confirm.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::confirm
 * @see app/Http/Controllers/ReturnController.php:536
 * @route '/returns/{productReturn}/confirm'
 */
confirm.post = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::reject
 * @see app/Http/Controllers/ReturnController.php:552
 * @route '/returns/{productReturn}/reject'
 */
export const reject = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/returns/{productReturn}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::reject
 * @see app/Http/Controllers/ReturnController.php:552
 * @route '/returns/{productReturn}/reject'
 */
reject.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reject.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::reject
 * @see app/Http/Controllers/ReturnController.php:552
 * @route '/returns/{productReturn}/reject'
 */
reject.post = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::process
 * @see app/Http/Controllers/ReturnController.php:566
 * @route '/returns/{productReturn}/process'
 */
export const process = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(args, options),
    method: 'post',
})

process.definition = {
    methods: ["post"],
    url: '/returns/{productReturn}/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReturnController::process
 * @see app/Http/Controllers/ReturnController.php:566
 * @route '/returns/{productReturn}/process'
 */
process.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return process.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::process
 * @see app/Http/Controllers/ReturnController.php:566
 * @route '/returns/{productReturn}/process'
 */
process.post = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: process.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:648
 * @route '/returns/{productReturn}'
 */
export const destroy = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/returns/{productReturn}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:648
 * @route '/returns/{productReturn}'
 */
destroy.url = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{productReturn}', parsedArgs.productReturn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReturnController::destroy
 * @see app/Http/Controllers/ReturnController.php:648
 * @route '/returns/{productReturn}'
 */
destroy.delete = (args: { productReturn: number | { id: number } } | [productReturn: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const returns = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
saisir19h: Object.assign(saisir19h, saisir19h),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
send: Object.assign(send, send),
confirm: Object.assign(confirm, confirm),
reject: Object.assign(reject, reject),
process: Object.assign(process, process),
photos: Object.assign(photos, photos),
destroy: Object.assign(destroy, destroy),
}

export default returns