---
title: "wp-native-features"
description: "Construir funcionalidades del sitio con las APIs del núcleo de WordPress en lugar de plugins: tipos de contenido y taxonomías propios expuestos al editor de bloques, metadatos con meta boxes nativas o register_post_meta, páginas de la Settings API para opciones globales, esquemas JSON-LD, ayudantes de iconos SVG en línea, subidas seguras, formularios de contacto con marcado limpio, internacionalización con Polylang y fundamentos de seguridad. Úsala al añadir tipos de contenido, campos, páginas de opciones, datos estructurados, formularios o integraciones (por ejemplo enlaces de WhatsApp) a un tema de bloques nativo, o cuando te tiente instalar un plugin para algo que el núcleo ya hace."
source-hash: "418c402699ec9a8d"
---

# Funcionalidades nativas (las APIs del núcleo antes que los plugins)

Parte siempre del núcleo de WordPress. Cada plugin es una dependencia que el cliente hereda: instala uno solo cuando haga algo sustancial que el núcleo no pueda (entrega de formularios, contenido multilingüe), y explica por qué en el PR.

## Modelo de contenido

- `register_post_type` y `register_taxonomy` en `init`, dentro de `inc/cpt.php`, siempre con `show_in_rest => true` (lo exige el editor de bloques), con `supports` sensatos, `has_archive` y slugs de reescritura en el idioma del sitio. Crea las plantillas `single-<cpt>.html` y `archive-<cpt>.html`.
- Campos: meta boxes nativas (`add_meta_box` más nonce, comprobación de capacidad y saneamiento al guardar) o `register_post_meta` con `show_in_rest`, `single`, `type` y `sanitize_callback` cuando los bloques necesiten el valor. Nada de ACF.
- Las tablas de consulta pequeñas y fijas (colores de categoría, iconos) pueden ser una función PHP con un mapa; márcala con un comentario `ponytail:` y añade interfaz de meta de término solo cuando el cliente tenga que editarla.
- Las funciones ayudantes llevan el prefijo del tema (`{theme}_...`), cada una documentada con su tipo de retorno.

## Opciones globales del sitio

Una página de la Settings API (`add_menu_page` o `add_options_page`, más `register_setting` con un `sanitize_callback` y `add_settings_field`) para cosas como el número de WhatsApp, la etiqueta por defecto de la llamada a la acción o el nombre del asesor. Expón funciones de lectura (`{theme}_wa_number()`) para que los bloques nunca lean las opciones directamente.

## Las integraciones, como ayudantes

Construye ayudantes reutilizables en vez de repetir la lógica dentro de los bloques: por ejemplo `{theme}_wa_url( $message )` (número saneado más el mensaje con `rawurlencode`), `{theme}_tel_href()`, o una cadena para lectores de pantalla que diga que el enlace abre en una pestaña nueva. Los botones flotantes se inyectan con `wp_footer` y llevan nombre accesible.

## Iconos y medios

- `{theme}_icon_svg( $slug )` devuelve el SVG en línea desde un mapa fijo (trazo en `currentColor`, `aria-hidden` cuando es decorativo). Un solo lenguaje de iconos para todo el sitio.
- Permite subir SVG únicamente con saneamiento y solo a administradores (`upload_mimes`, `wp_check_filetype_and_ext`, `wp_handle_upload_prefilter`).

## Datos estructurados

`inc/schema.php` imprime JSON-LD en `wp_head` para el tipo de negocio (TravelAgency, LocalBusiness, Organization), más los tipos por plantilla (Product/Offer, FAQPage, BreadcrumbList) construidos a partir de contenido real. Valídalo con la prueba de resultados enriquecidos de Google y registra la evidencia.

## Formularios

Contact Form 7 (o la herramienta del cliente) con tu propio marcado: desactiva el formateo automático (`wpcf7_autop_or_not` a false) y escribe la plantilla del formulario con la rejilla y las etiquetas del tema. Carga los recursos del plugin solo en las páginas que contengan el formulario (`wp-performance-audit`). Las etiquetas, los errores y los mensajes de éxito deben cumplir `sumi:a11y`.

## Internacionalización

Las cadenas del tema pasan por `__()` con el dominio de texto del tema; la traducción del contenido va por Polylang. Los patrones y los valores por defecto de los bloques son traducibles, así que el mismo tema sirve para todos los idiomas.

## Línea base de seguridad

Escapa tarde (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`), sanea pronto (`sanitize_text_field`, `absint`, callbacks propias), nonces y `current_user_can` en cada manejador de guardado y en cada acción de administración, `$wpdb->prepare` para cualquier consulta cruda, y `if ( ! defined( 'ABSPATH' ) ) exit;` al principio de cada archivo PHP.

## Lista de verificación

- [ ] No se añadió ningún plugin para algo que hace el núcleo; todo plugin nuevo está justificado.
- [ ] Los tipos de contenido, taxonomías y metadatos se ven en el editor de bloques (`show_in_rest`).
- [ ] Cada ruta de guardado tiene nonce, capacidad y saneamiento.
- [ ] Las opciones se leen a través de ayudantes; el esquema está validado.
