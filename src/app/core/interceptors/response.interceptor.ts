import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                // Check if response has the success/data wrapper
                const body = event.body as any;
                if (body && body.success === true && body.hasOwnProperty('data')) {
                    // Unwrap the data
                    return event.clone({ body: body.data });
                }
            }
            return event;
        }),
        catchError((error: HttpErrorResponse) => {
            // Consistent error handling
            let errorMessage = 'Ha ocurrido un error inesperado';

            if (error.error && error.error.success === false) {
                // Extract message from our new backend structure
                errorMessage = error.error.message || errorMessage;
            } else if (error.status === 0) {
                errorMessage = 'No se pudo conectar con el servidor';
            }

            // Return a new error object with the formatted message
            // We keep the original error structure but ensure message is prominent
            return throwError(() => ({
                ...error,
                message: errorMessage,
                error: error.error // Keep original error body just in case
            }));
        })
    );
};
