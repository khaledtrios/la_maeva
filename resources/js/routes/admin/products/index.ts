import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
 * @see routes/web.php:304
 * @route '/admin/products/recalc-costs'
 */
export const recalcCosts = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recalcCosts.url(options),
    method: 'post',
})

recalcCosts.definition = {
    methods: ["post"],
    url: '/admin/products/recalc-costs',
} satisfies RouteDefinition<["post"]>

/**
 * @see routes/web.php:304
 * @route '/admin/products/recalc-costs'
 */
recalcCosts.url = (options?: RouteQueryOptions) => {
    return recalcCosts.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:304
 * @route '/admin/products/recalc-costs'
 */
recalcCosts.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recalcCosts.url(options),
    method: 'post',
})
const products = {
    recalcCosts: Object.assign(recalcCosts, recalcCosts),
}

export default products