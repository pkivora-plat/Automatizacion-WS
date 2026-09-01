# DORADITO — empresa de ejemplo y automatización de ventas

DORADITO es un tenant independiente administrado por ZOLMYRA, no un módulo global ni datos
compartidos entre clientes. Su flujo sirve como plantilla reutilizable: cada organización que lo
adopte tendrá su propia copia, configuración, precios, catálogo y ejecuciones.

## Objetivo

Atender consultas sobre anillos de graduación y matrimoniales, recopilar los datos necesarios, mostrar precios orientativos y catálogo, gestionar ubicación/envío/pago y transferir compradores a un closer.

## Datos de sesión

- `ring_type`: graduación o matrimonial
- `university`: universidad para anillos de graduación
- `size`: número entre 4 y 13, admitiendo incrementos de 0.5
- `material`: oro o plata
- `category`: pequeño, mediano o grande
- `province`: provincia de destino
- `transport`: Vimenca, Atra, Caribe Express o transporte público
- `payment_method`: efectivo o transferencia
- `preferred_bank`: banco seleccionado
- `buy_now`: intención explícita de compra
- `human_assistance`: solicita representante

## Reglas de seguridad

1. No inventar precios, disponibilidad, dirección, cuentas bancarias ni tiempos de entrega.
2. Presentar los precios como orientativos y explicar que el monto final depende del peso real.
3. Nunca solicitar contraseñas, PIN, códigos de verificación ni datos completos de tarjeta.
4. Enviar datos bancarios únicamente desde fuentes verificadas de la organización.
5. Cuando exista intención de compra, crear una oportunidad y ofrecer transferencia inmediata a un closer.
6. Si falta información autorizada, indicar que un representante la confirmará.

## Integración N8N prevista

El webhook recibirá `organization_id`, `conversation_id`, `contact_id`, intención y campos recopilados. N8N gestionará catálogo, notificación al closer, logística y tareas externas; Zolmyra conservará la conversación y el estado comercial como fuente principal.
