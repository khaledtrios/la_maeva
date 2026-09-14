import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::submit
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:26
 * @route '/register'
 */
export const submit = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/register',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::submit
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:26
 * @route '/register'
 */
submit.url = (options?: RouteQueryOptions) => {
    return submit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::submit
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:26
 * @route '/register'
 */
submit.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(options),
    method: 'post',
})
const register = {
    submit: Object.assign(submit, submit),
}

export default register