import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventoryController::lotsIndex
 * @see app/Http/Controllers/InventoryController.php:169
 * @route '/inventory/lots'
 */
export const lotsIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lotsIndex.url(options),
    method: 'get',
})

lotsIndex.definition = {
    methods: ["get","head"],
    url: '/inventory/lots',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::lotsIndex
 * @see app/Http/Controllers/InventoryController.php:169
 * @route '/inventory/lots'
 */
lotsIndex.url = (options?: RouteQueryOptions) => {
    return lotsIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::lotsIndex
 * @see app/Http/Controllers/InventoryController.php:169
 * @route '/inventory/lots'
 */
lotsIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lotsIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::lotsIndex
 * @see app/Http/Controllers/InventoryController.php:169
 * @route '/inventory/lots'
 */
lotsIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: lotsIndex.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
export const adjustBatch = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: adjustBatch.url(options),
    method: 'put',
})

adjustBatch.definition = {
    methods: ["put"],
    url: '/inventory/adjust-batch',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
adjustBatch.url = (options?: RouteQueryOptions) => {
    return adjustBatch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
adjustBatch.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: adjustBatch.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
 */
export const update = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/inventory/{ingredient}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
 */
update.url = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingredient: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { ingredient: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    ingredient: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingredient: typeof args.ingredient === 'object'
                ? args.ingredient.id
                : args.ingredient,
                }

    return update.definition.url
            .replace('{ingredient}', parsedArgs.ingredient.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
 */
update.put = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\InventoryController::createIngredientWithStock
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
export const createIngredientWithStock = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createIngredientWithStock.url(options),
    method: 'post',
})

createIngredientWithStock.definition = {
    methods: ["post"],
    url: '/inventory/create-ingredient',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::createIngredientWithStock
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
createIngredientWithStock.url = (options?: RouteQueryOptions) => {
    return createIngredientWithStock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::createIngredientWithStock
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
createIngredientWithStock.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createIngredientWithStock.url(options),
    method: 'post',
})
const InventoryController = { index, lotsIndex, adjustBatch, update, createIngredientWithStock }

export default InventoryController