"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "es"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const translations = {
    en: {
        "nav.home": "Home",
        "nav.formats": "Formats",
        "nav.ad_builder": "Ad Builder",
        "nav.media_kit": "Media Kit",
        "nav.admin": "Admin Dashboard",
        "nav.sign_out": "Sign Out",
        "nav.adelia_tools": "Adelia Tools",
        "admin.title": "Admin Dashboard",
        "admin.subtitle": "Overview of all platform activity and revenue.",
        "admin.refresh": "Refresh Data",
        "admin.total_revenue": "Total Revenue",
        "admin.total_ads": "Total Ads Generated",
        "admin.active_kits": "Active Media Kits",
        "admin.tab.ads": "All Ads",
        "admin.tab.profiles": "Media Kits",
        "admin.ads.title": "Global Ad Inventory",
        "admin.ads.desc": "All ads created by all users.",
        "admin.table.campaign": "Campaign",
        "admin.table.type": "Type",
        "admin.table.user": "User / Brand",
        "admin.table.status": "Status",
        "admin.table.created": "Created",
        "admin.table.actions": "Actions",
        "admin.profiles.title": "Registered Media Kits",
        "admin.profiles.desc": "All users who have set up a public profile.",
        "admin.profiles.brand": "Brand",
        "admin.profiles.email": "Email",
        "admin.profiles.traffic": "Traffic",
        "admin.profiles.slots": "Slots",
        "admin.profiles.public_page": "Public Page",
        "admin.profiles.view_page": "View Page",
        "dialog.performance": "Performance",
        "dialog.report_desc": "Analytics report for the last 7 days.",
        "dialog.revenue": "Revenue",
        "dialog.est_earnings": "Est. earnings based on CPM",
        "dialog.impressions": "Impressions",
        "dialog.clicks": "Clicks",
        "dialog.ctr": "CTR",
        "dialog.revenue_trend": "Revenue Trend",
        "dialog.imp_vs_clicks": "Impressions vs Clicks",
        "status.active": "Active",
        "status.paused": "Paused",
        "status.draft": "Draft",
        "month": "mo",
        "display": "Display",

        // Home Page
        "home.title": "The complete platform to build digital ads.",
        "home.subtitle": "Your team's toolkit to stop configuring and start creating. Build, deploy, and scale the best advertising experiences.",
        "home.card.formats.title": "Multiple Formats",
        "home.card.formats.desc": "Create ads for Desktop, Mobile, and Video platforms with our intuitive gallery system.",
        "home.card.builder.title": "Ad Builder",
        "home.card.builder.desc": "Design custom advertisements with our powerful form builder and instant preview.",
        "home.card.support.title": "24/7 Support",
        "home.card.support.desc": "Get instant help with our AI-powered chatbot for all your queries and questions.",
        "home.welcome": "Welcome to Adelia",
        "home.welcome.desc": "Your complete platform to create and manage digital advertisements",
        "home.login": "Login",
        "home.secure_auth": "Secure authentication powered by Google",
        "home.click_enter": "Click to enter",

        // Formats Page
        "formats.title": "Choose Your Ad Format",
        "formats.subtitle": "Select from our comprehensive gallery of ad formats optimized for Desktop, Mobile, or Video platforms.",
        "formats.desktop": "Desktop",
        "formats.mobile": "Mobile",
        "formats.video": "Video",
        "formats.create_now": "Create Now",
        "formats.dimensions": "Dimensions",
        "formats.no_formats": "No formats found for this category yet.",
        "formats.select_format": "Select a format above to view available ad sizes",

        // Media Kit Settings
        "media_kit.title": "Media Kit Settings",
        "media_kit.subtitle": "Configure your public sales page.",
        "media_kit.view_public": "View Public Page",
        "media_kit.save_changes": "Save Changes",
        "media_kit.brand_profile": "Brand Profile",
        "media_kit.brand_desc": "How you appear to advertisers.",
        "media_kit.display_name": "Display Name",
        "media_kit.bio": "Bio / About Us",
        "media_kit.bio_placeholder": "Describe your audience and content...",
        "media_kit.contact_email": "Contact Email",
        "media_kit.logo": "Logo",
        "media_kit.traffic_metrics": "Traffic Metrics",
        "media_kit.traffic_desc": "Highlight your reach.",
        "media_kit.monthly_views": "Monthly Views",
        "media_kit.audience_desc": "Audience Description",
        "media_kit.ad_inventory": "Ad Inventory",
        "media_kit.inventory_desc": "Define the slots you are selling.",
        "media_kit.add_slot": "Add Slot",
        "media_kit.no_slots": "No slots defined yet. Add one to start selling!",
        "media_kit.slot_name": "Name",
        "media_kit.slot_format": "Format",
        "media_kit.slot_price": "Price ($)",
        "media_kit.slot_description": "Description",
        "media_kit.slot_placeholder": "Placement details...",
        "media_kit.saved": "Profile Saved",
        "media_kit.saved_desc": "Your media kit has been updated.",
        "media_kit.access_denied": "Access Denied",
        "media_kit.access_denied_desc": "You are not authorized to edit Media Kit settings.",
        "media_kit.copy_link": "Copy Link",
        "media_kit.link_copied": "Link Copied",
        "media_kit.share_tooltip": "Copy public link to clipboard",

        // Ad Builder
        "builder.require_login_title": "Ad Builder requires login",
        "builder.require_login_desc": "You can browse formats, but to generate ads you need to sign in.",
        "builder.go_to_login": "Go to login",
        "builder.create_new": "Create New",
        "builder.saved_ads": "My Saved Ads",
        "builder.title": "Adelia Builder",
        "builder.editing_saved": "Editing saved ad",
        "builder.choose_type": "Choose ad type",
        "builder.available_formats": "Available now: Push Expandable, Puzzle 300x250, ColorAd 300x250 and Podcastwith 300x250. More coming soon!",
        "builder.select_format_prompt": "Select a format from the list to start creating your ad.",
        "builder.coming_soon": "Builder coming soon",
        "builder.coming_soon_desc": "The builder for this format is not available yet.",
        // Scratch Builder
        "builder.campaign_name": "Campaign Name",
        "builder.cover_image": "Cover Image (Scratch Layer)",
        "builder.back_image": "Back Image (Hidden Layer)",
        "builder.generate_download": "Generate & Download ZIP"
    },
    es: {
        "nav.home": "Inicio",
        "nav.formats": "Formatos",
        "nav.ad_builder": "Constructor de Anuncios",
        "nav.media_kit": "Media Kit",
        "nav.admin": "Panel de Administración",
        "nav.sign_out": "Cerrar Sesión",
        "nav.adelia_tools": "Adelia Tools",
        "admin.title": "Panel de Administración",
        "admin.subtitle": "Resumen de toda la actividad y los ingresos de la plataforma.",
        "admin.refresh": "Actualizar Datos",
        "admin.total_revenue": "Total Revenue", // Metric -> English
        "admin.total_ads": "Total Ads Generados",
        "admin.active_kits": "Media Kits Activos",
        "admin.tab.ads": "Todos los Anuncios",
        "admin.tab.profiles": "Media Kits",
        "admin.ads.title": "Inventario Global de Anuncios",
        "admin.ads.desc": "Todos los anuncios creados por los usuarios.",
        "admin.table.campaign": "Campaña",
        "admin.table.type": "Tipo",
        "admin.table.user": "Usuario / Marca",
        "admin.table.status": "Estado",
        "admin.table.created": "Creado",
        "admin.table.actions": "Acciones",
        "admin.profiles.title": "Media Kits Registrados",
        "admin.profiles.desc": "Usuarios que han configurado un perfil público.",
        "admin.profiles.brand": "Marca",
        "admin.profiles.email": "Email",
        "admin.profiles.traffic": "Tráfico",
        "admin.profiles.slots": "Espacios",
        "admin.profiles.public_page": "Página Pública",
        "admin.profiles.view_page": "Ver Página",
        "dialog.performance": "Rendimiento",
        "dialog.report_desc": "Informe de análisis de los últimos 7 días.",
        "dialog.revenue": "Revenue", // Metric
        "dialog.est_earnings": "Ganancias est. basadas en CPM",
        "dialog.impressions": "Impressions", // Metric
        "dialog.clicks": "Clicks", // Metric
        "dialog.ctr": "CTR", // Metric
        "dialog.revenue_trend": "Tendencia de Revenue",
        "dialog.imp_vs_clicks": "Impressions vs Clicks",
        "status.active": "Activo",
        "status.paused": "Pausado",
        "status.draft": "Borrador",
        "month": "mes",
        "display": "Display",

        // Home Page
        "home.title": "La plataforma completa para crear anuncios digitales.",
        "home.subtitle": "El set de herramientas para que tu equipo deje de configurar y empiece a crear. Construye, despliega y escala las mejores experiencias publicitarias.",
        "home.card.formats.title": "Múltiples Formatos",
        "home.card.formats.desc": "Crea anuncios para Escritorio, Móvil y Video con nuestra galería intuitiva.",
        "home.card.builder.title": "Constructor de Anuncios",
        "home.card.builder.desc": "Diseña anuncios personalizados con nuestro potente constructor e instrumentos de vista previa.",
        "home.card.support.title": "Soporte 24/7",
        "home.card.support.desc": "Obtén ayuda instantánea con nuestro chatbot con IA para todas tus consultas.",
        "home.welcome": "Bienvenido a Adelia",
        "home.welcome.desc": "Tu plataforma completa para crear y gestionar anuncios digitales",
        "home.login": "Iniciar Sesión",
        "home.secure_auth": "Autenticación segura con Google",
        "home.click_enter": "Click para entrar",

        // Formats Page
        "formats.title": "Elige tu Formato de Anuncio",
        "formats.subtitle": "Selecciona de nuestra completa galería de formatos optimizados para Escritorio, Móvil o Video.",
        "formats.desktop": "Escritorio",
        "formats.mobile": "Móvil",
        "formats.video": "Video",
        "formats.create_now": "Crear Ahora",
        "formats.dimensions": "Dimensiones",
        "formats.no_formats": "No se encontraron formatos para esta categoría.",
        "formats.select_format": "Selecciona un formato arriba para ver los tamaños disponibles",

        // Media Kit Settings
        "media_kit.title": "Configuración de Media Kit",
        "media_kit.subtitle": "Configura tu página pública de ventas.",
        "media_kit.view_public": "Ver Página Pública",
        "media_kit.save_changes": "Guardar Cambios",
        "media_kit.brand_profile": "Perfil de Marca",
        "media_kit.brand_desc": "Cómo apareces ante los anunciantes.",
        "media_kit.display_name": "Nombre Visible",
        "media_kit.bio": "Bio / Sobre Nosotros",
        "media_kit.bio_placeholder": "Describe tu audiencia y contenido...",
        "media_kit.contact_email": "Email de Contacto",
        "media_kit.logo": "Logo",
        "media_kit.traffic_metrics": "Métricas de Tráfico",
        "media_kit.traffic_desc": "Destaca tu alcance.",
        "media_kit.monthly_views": "Vistas Mensuales",
        "media_kit.audience_desc": "Descripción de Audiencia",
        "media_kit.ad_inventory": "Inventario de Anuncios",
        "media_kit.inventory_desc": "Define los espacios que vendes.",
        "media_kit.add_slot": "Agregar Espacio",
        "media_kit.no_slots": "No hay espacios definidos. ¡Agrega uno para empezar a vender!",
        "media_kit.slot_name": "Nombre",
        "media_kit.slot_format": "Formato",
        "media_kit.slot_price": "Precio ($)",
        "media_kit.slot_description": "Descripción",
        "media_kit.slot_placeholder": "Detalles de ubicación...",
        "media_kit.saved": "Perfil Guardado",
        "media_kit.saved_desc": "Tu media kit ha sido actualizado.",
        "media_kit.access_denied": "Acceso Denegado",
        "media_kit.access_denied_desc": "No estás autorizado para editar configuraciones de Media Kit.",
        "media_kit.copy_link": "Copiar Link",
        "media_kit.link_copied": "Link Copiado",
        "media_kit.share_tooltip": "Copiar link público",

        // Ad Builder
        "builder.require_login_title": "Ad Builder requiere login",
        "builder.require_login_desc": "Podes seguir explorando formatos, pero para generar anuncios necesitas iniciar sesión.",
        "builder.go_to_login": "Ir al login",
        "builder.create_new": "Crear Nuevo",
        "builder.saved_ads": "Mis Guardados",
        "builder.title": "Adelia Builder",
        "builder.editing_saved": "Editando anuncio guardado",
        "builder.choose_type": "Elegí el tipo de anuncio",
        "builder.available_formats": "Disponible en este momento: Push Expandable, Puzzle 300x250, ColorAd 300x250 y Podcastwith 300x250. ¡Pronto más formatos!",
        "builder.select_format_prompt": "Selecciona un formato de la lista para comenzar a crear tu anuncio.",
        "builder.coming_soon": "Builder en camino",
        "builder.coming_soon_desc": "Todavía no está disponible el builder para este formato.",
        // Scratch Builder
        "builder.campaign_name": "Nombre de Campaña",
        "builder.cover_image": "Imagen de Cubierta (Capa para raspar)",
        "builder.back_image": "Imagen de Fondo (Capa oculta)",
        "builder.generate_download": "Generar y Descargar ZIP"
    }
}

// Adjusting 'Type' and 'Status' to be properly localized or English based on strict 'advertising language' rule? 
// User said: "metrics... in english". Type/Status are properties. I will localize them to Spanish unless they are strictly metrics.
// "Revenue", "Impressions", "Clicks", "CPM", "CTR" are metrics.
// "Type", "Status" are attributes. I will translate them to Spanish: "Tipo", "Estado".

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en")

    // Optional: Persist language preference
    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang) setLanguage(savedLang)
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem("language", lang)
    }

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations['en']] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
