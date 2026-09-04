<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockStoreAdminFromAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Store Admin : redirige vers /store/employees
        if (auth('store')->check()) {
            return redirect()->route('store.employees.index')
                ->with('info', 'Les Store Admin gèrent leurs employés via la section Employés.');
        }

        return $next($request);
    }
}
