use actix_files as fs;
use actix_http::{body::Body, Response};
use actix_web::{
    dev::ServiceResponse,
    error, get,
    http::StatusCode,
    middleware::{
        self,
        errhandlers::{ErrorHandlerResponse, ErrorHandlers},
    },
    web, App, Error, HttpResponse, HttpServer,
};
use std::collections::HashMap;
use tera::Tera;

// Custom error handlers, to return HTML responses when an error occurs.
fn error_handlers() -> ErrorHandlers<Body> {
    ErrorHandlers::new().handler(StatusCode::NOT_FOUND, not_found)
}

// Error handler for a 404 Page not found error.
fn not_found<B>(res: ServiceResponse<B>) -> actix_web::Result<ErrorHandlerResponse<B>> {
    let response = get_error_response(&res, "Page not found");
    Ok(ErrorHandlerResponse::Response(
        res.into_response(response.into_body()),
    ))
}

// Generic error handler.
fn get_error_response<B>(res: &ServiceResponse<B>, error: &str) -> Response<Body> {
    let request = res.request();

    // Provide a fallback to a simple plain text response in case an error occurs during the
    // rendering of the error page.
    let fallback = |e: &str| {
        Response::build(res.status())
            .content_type("text/plain")
            .body(e.to_string())
    };

    let tera = request.app_data::<web::Data<Tera>>().map(|t| t.get_ref());
    match tera {
        Some(tera) => {
            let mut context = tera::Context::new();
            context.insert("error", error);
            context.insert("status_code", res.status().as_str());
            let body = tera.render("error.html", &context);

            match body {
                Ok(body) => Response::build(res.status())
                    .content_type("text/html")
                    .body(body),
                Err(_) => fallback(error),
            }
        }
        None => fallback(error),
    }
}

#[get("/")]
async fn index(
    tmpl: web::Data<tera::Tera>,
    _query: web::Query<HashMap<String, String>>,
) -> Result<HttpResponse, Error> {
    let s = tmpl
        .render("index.html", &tera::Context::new())
        .map_err(|_| error::ErrorInternalServerError("Template error"))?;

    Ok(HttpResponse::Ok().content_type("text/html").body(s))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let tera = Tera::new(concat!(env!("CARGO_MANIFEST_DIR"), "/views/**/*")).unwrap();

        App::new()
            .data(tera)
            .wrap(middleware::Logger::default())
            .service(index)
            .service(fs::Files::new("/static", "./static").show_files_listing())
            .service(web::scope("").wrap(error_handlers()))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
