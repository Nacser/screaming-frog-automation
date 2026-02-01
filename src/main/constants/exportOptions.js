/**
 * Opciones de exportación de Screaming Frog SEO Spider
 * Organizadas en Export Tabs y Bulk Exports
 */

module.exports = {
  // ═══════════════════════════════════════════════════════════════
  // EXPORT TABS - Pestañas con filtros (--export-tabs)
  // ═══════════════════════════════════════════════════════════════
  exportTabs: {
    internal: {
      label: 'Internal',
      filters: {
        all: { label: 'All', cliValue: 'Internal:All', primary: true },
        html: { label: 'HTML', cliValue: 'Internal:HTML' },
        javascript: { label: 'JavaScript', cliValue: 'Internal:JavaScript' },
        css: { label: 'CSS', cliValue: 'Internal:CSS' },
        images: { label: 'Images', cliValue: 'Internal:Images' },
        pdf: { label: 'PDF', cliValue: 'Internal:PDF' },
        flash: { label: 'Flash', cliValue: 'Internal:Flash' },
        other: { label: 'Other', cliValue: 'Internal:Other' },
        unknown: { label: 'Unknown', cliValue: 'Internal:Unknown' }
      }
    },

    external: {
      label: 'External',
      filters: {
        all: { label: 'All', cliValue: 'External:All', primary: true },
        html: { label: 'HTML', cliValue: 'External:HTML' },
        javascript: { label: 'JavaScript', cliValue: 'External:JavaScript' },
        css: { label: 'CSS', cliValue: 'External:CSS' },
        images: { label: 'Images', cliValue: 'External:Images' },
        pdf: { label: 'PDF', cliValue: 'External:PDF' },
        flash: { label: 'Flash', cliValue: 'External:Flash' },
        other: { label: 'Other', cliValue: 'External:Other' },
        unknown: { label: 'Unknown', cliValue: 'External:Unknown' }
      }
    },

    responseCodes: {
      label: 'Response Codes',
      filters: {
        all: { label: 'All', cliValue: 'Response Codes:All', primary: true },
        blockedRobots: { label: 'Blocked by Robots.txt', cliValue: 'Response Codes:Blocked by Robots.txt' },
        blockedResource: { label: 'Blocked Resource', cliValue: 'Response Codes:Blocked Resource' },
        noResponse: { label: 'No Response', cliValue: 'Response Codes:No Response' },
        success2xx: { label: 'Success (2XX)', cliValue: 'Response Codes:Success (2XX)' },
        redirection3xx: { label: 'Redirection (3XX)', cliValue: 'Response Codes:Redirection (3XX)', primary: true },
        redirectionJs: { label: 'Redirection (JavaScript)', cliValue: 'Response Codes:Redirection (JavaScript)' },
        redirectionMeta: { label: 'Redirection (Meta Refresh)', cliValue: 'Response Codes:Redirection (Meta Refresh)' },
        clientError4xx: { label: 'Client Error (4XX)', cliValue: 'Response Codes:Client Error (4XX)', primary: true },
        serverError5xx: { label: 'Server Error (5XX)', cliValue: 'Response Codes:Server Error (5XX)', primary: true }
      }
    },

    url: {
      label: 'URL',
      filters: {
        all: { label: 'All', cliValue: 'URL:All', primary: true },
        nonAscii: { label: 'Non ASCII Characters', cliValue: 'URL:Non ASCII Characters' },
        underscores: { label: 'Underscores', cliValue: 'URL:Underscores' },
        uppercase: { label: 'Uppercase', cliValue: 'URL:Uppercase' },
        multipleSlashes: { label: 'Multiple Slashes', cliValue: 'URL:Multiple Slashes' },
        repetitivePath: { label: 'Repetitive Path', cliValue: 'URL:Repetitive Path' },
        containsSpace: { label: 'Contains Space', cliValue: 'URL:Contains A Space' },
        internalSearch: { label: 'Internal Search', cliValue: 'URL:Internal Search' },
        parameters: { label: 'Parameters', cliValue: 'URL:Parameters' },
        brokenBookmark: { label: 'Broken Bookmark', cliValue: 'URL:Broken Bookmark' },
        gaParams: { label: 'GA Tracking Parameters', cliValue: 'URL:GA Tracking Parameters' },
        over115: { label: 'Over 115 Characters', cliValue: 'URL:Over 115 Characters' }
      }
    },

    pageTitles: {
      label: 'Page Titles',
      filters: {
        all: { label: 'All', cliValue: 'Page Titles:All', primary: true },
        missing: { label: 'Missing', cliValue: 'Page Titles:Missing', primary: true },
        duplicate: { label: 'Duplicate', cliValue: 'Page Titles:Duplicate', primary: true },
        over60: { label: 'Over 60 Characters', cliValue: 'Page Titles:Over 60 Characters' },
        below30: { label: 'Below 30 Characters', cliValue: 'Page Titles:Below 30 Characters' },
        overPixels: { label: 'Over X Pixels', cliValue: 'Page Titles:Over X Pixels' },
        belowPixels: { label: 'Below X Pixels', cliValue: 'Page Titles:Below X Pixels' },
        sameAsH1: { label: 'Same as H1', cliValue: 'Page Titles:Same as H1' },
        multiple: { label: 'Multiple', cliValue: 'Page Titles:Multiple' },
        outsideHead: { label: 'Outside <head>', cliValue: 'Page Titles:Outside <head>' }
      }
    },

    metaDescription: {
      label: 'Meta Description',
      filters: {
        all: { label: 'All', cliValue: 'Meta Description:All', primary: true },
        missing: { label: 'Missing', cliValue: 'Meta Description:Missing', primary: true },
        duplicate: { label: 'Duplicate', cliValue: 'Meta Description:Duplicate', primary: true },
        over155: { label: 'Over 155 Characters', cliValue: 'Meta Description:Over 155 Characters' },
        below70: { label: 'Below 70 Characters', cliValue: 'Meta Description:Below 70 Characters' },
        overPixels: { label: 'Over X Pixels', cliValue: 'Meta Description:Over X Pixels' },
        belowPixels: { label: 'Below X Pixels', cliValue: 'Meta Description:Below X Pixels' },
        multiple: { label: 'Multiple', cliValue: 'Meta Description:Multiple' },
        outsideHead: { label: 'Outside <head>', cliValue: 'Meta Description:Outside <head>' }
      }
    },

    metaKeywords: {
      label: 'Meta Keywords',
      filters: {
        all: { label: 'All', cliValue: 'Meta Keywords:All', primary: true },
        missing: { label: 'Missing', cliValue: 'Meta Keywords:Missing' },
        duplicate: { label: 'Duplicate', cliValue: 'Meta Keywords:Duplicate' },
        multiple: { label: 'Multiple', cliValue: 'Meta Keywords:Multiple' }
      }
    },

    h1: {
      label: 'H1',
      filters: {
        all: { label: 'All', cliValue: 'H1:All', primary: true },
        missing: { label: 'Missing', cliValue: 'H1:Missing', primary: true },
        duplicate: { label: 'Duplicate', cliValue: 'H1:Duplicate', primary: true },
        over70: { label: 'Over 70 Characters', cliValue: 'H1:Over 70 Characters' },
        multiple: { label: 'Multiple', cliValue: 'H1:Multiple' },
        altInH1: { label: 'Alt Text In H1', cliValue: 'H1:Alt Text In H1' },
        nonSequential: { label: 'Non-Sequential', cliValue: 'H1:Non-Sequential' }
      }
    },

    h2: {
      label: 'H2',
      filters: {
        all: { label: 'All', cliValue: 'H2:All', primary: true },
        missing: { label: 'Missing', cliValue: 'H2:Missing' },
        duplicate: { label: 'Duplicate', cliValue: 'H2:Duplicate' },
        over70: { label: 'Over 70 Characters', cliValue: 'H2:Over 70 Characters' },
        multiple: { label: 'Multiple', cliValue: 'H2:Multiple' },
        nonSequential: { label: 'Non-Sequential', cliValue: 'H2:Non-Sequential' }
      }
    },

    content: {
      label: 'Content',
      filters: {
        all: { label: 'All', cliValue: 'Content:All', primary: true },
        exactDuplicates: { label: 'Exact Duplicates', cliValue: 'Content:Exact Duplicates', primary: true },
        nearDuplicates: { label: 'Near Duplicates', cliValue: 'Content:Near Duplicates' },
        lowContent: { label: 'Low Content Pages', cliValue: 'Content:Low Content Pages' },
        soft404: { label: 'Soft 404 Pages', cliValue: 'Content:Soft 404 Pages' },
        spellingErrors: { label: 'Spelling Errors', cliValue: 'Content:Spelling Errors' },
        grammarErrors: { label: 'Grammar Errors', cliValue: 'Content:Grammar Errors' },
        readabilityDifficult: { label: 'Readability Difficult', cliValue: 'Content:Readability Difficult' },
        readabilityVeryDifficult: { label: 'Readability Very Difficult', cliValue: 'Content:Readability Very Difficult' },
        loremIpsum: { label: 'Lorem Ipsum Placeholder', cliValue: 'Content:Lorem Ipsum Placeholder' }
      }
    },

    images: {
      label: 'Images',
      filters: {
        all: { label: 'All', cliValue: 'Images:All', primary: true },
        over100kb: { label: 'Over 100kb', cliValue: 'Images:Over 100kb' },
        missingAltText: { label: 'Missing Alt Text', cliValue: 'Images:Missing Alt Text', primary: true },
        missingAltAttr: { label: 'Missing Alt Attribute', cliValue: 'Images:Missing Alt Attribute' },
        altOver100: { label: 'Alt Text Over 100 Characters', cliValue: 'Images:Alt Text Over 100 Characters' },
        background: { label: 'Background Images', cliValue: 'Images:Background Images' },
        missingSizeAttrs: { label: 'Missing Size Attributes', cliValue: 'Images:Missing Size Attributes' },
        incorrectlySized: { label: 'Incorrectly Sized Images', cliValue: 'Images:Incorrectly Sized Images' }
      }
    },

    canonicals: {
      label: 'Canonicals',
      filters: {
        all: { label: 'All', cliValue: 'Canonicals:All', primary: true },
        contains: { label: 'Contains Canonical', cliValue: 'Canonicals:Contains Canonical' },
        selfReferencing: { label: 'Self Referencing', cliValue: 'Canonicals:Self Referencing' },
        canonicalised: { label: 'Canonicalised', cliValue: 'Canonicals:Canonicalised' },
        missing: { label: 'Missing', cliValue: 'Canonicals:Missing', primary: true },
        multiple: { label: 'Multiple', cliValue: 'Canonicals:Multiple' },
        nonIndexable: { label: 'Non-Indexable Canonical', cliValue: 'Canonicals:Non-Indexable Canonical' }
      }
    },

    directives: {
      label: 'Directives',
      filters: {
        all: { label: 'All', cliValue: 'Directives:All', primary: true },
        index: { label: 'Index', cliValue: 'Directives:Index' },
        noindex: { label: 'Noindex', cliValue: 'Directives:Noindex', primary: true },
        follow: { label: 'Follow', cliValue: 'Directives:Follow' },
        nofollow: { label: 'Nofollow', cliValue: 'Directives:Nofollow' },
        noArchive: { label: 'NoArchive', cliValue: 'Directives:NoArchive' },
        noSnippet: { label: 'NoSnippet', cliValue: 'Directives:NoSnippet' },
        noOdp: { label: 'NoODP', cliValue: 'Directives:NoODP' },
        noImageIndex: { label: 'NoImageIndex', cliValue: 'Directives:NoImageIndex' },
        noTranslate: { label: 'NoTranslate', cliValue: 'Directives:NoTranslate' },
        unavailableAfter: { label: 'Unavailable After', cliValue: 'Directives:Unavailable After' },
        refresh: { label: 'Refresh', cliValue: 'Directives:Refresh' }
      }
    },

    hreflang: {
      label: 'Hreflang',
      filters: {
        all: { label: 'All', cliValue: 'Hreflang:All', primary: true },
        contains: { label: 'Contains Hreflang', cliValue: 'Hreflang:Contains Hreflang' },
        nonHtmlLanguage: { label: 'Non-200 Hreflang URLs', cliValue: 'Hreflang:Non-200 Hreflang URLs' },
        missing: { label: 'Missing Return Links', cliValue: 'Hreflang:Missing Return Links', primary: true },
        inconsistentLanguage: { label: 'Inconsistent Language', cliValue: 'Hreflang:Inconsistent Language' },
        missingXDefault: { label: 'Missing X-Default', cliValue: 'Hreflang:Missing X-Default' },
        missingRelAlternate: { label: 'Missing Self Reference', cliValue: 'Hreflang:Missing Self Reference' }
      }
    },

    security: {
      label: 'Security',
      filters: {
        all: { label: 'All', cliValue: 'Security:All', primary: true },
        httpUrls: { label: 'HTTP URLs', cliValue: 'Security:HTTP URLs', primary: true },
        httpsUrls: { label: 'HTTPS URLs', cliValue: 'Security:HTTPS URLs' },
        mixedContent: { label: 'Mixed Content', cliValue: 'Security:Mixed Content', primary: true },
        formInsecure: { label: 'Form URL Insecure', cliValue: 'Security:Form URL Insecure' },
        formOnHttp: { label: 'Form on HTTP URL', cliValue: 'Security:Form on HTTP URL' },
        unsafeCrossOrigin: { label: 'Unsafe Cross-Origin Links', cliValue: 'Security:Unsafe Cross-Origin Links' },
        protocolRelative: { label: 'Protocol-Relative Resource Links', cliValue: 'Security:Protocol-Relative Resource Links' },
        missingHsts: { label: 'Missing HSTS Header', cliValue: 'Security:Missing HSTS Header' },
        missingCsp: { label: 'Missing Content-Security-Policy', cliValue: 'Security:Missing Content-Security-Policy Header' },
        missingXContentType: { label: 'Missing X-Content-Type-Options', cliValue: 'Security:Missing X-Content-Type-Options Header' },
        missingXFrameOptions: { label: 'Missing X-Frame-Options', cliValue: 'Security:Missing X-Frame-Options Header' },
        badContentType: { label: 'Bad Content Type', cliValue: 'Security:Bad Content Type' }
      }
    },

    structuredData: {
      label: 'Structured Data',
      filters: {
        all: { label: 'All', cliValue: 'Structured Data:All', primary: true },
        contains: { label: 'Contains Structured Data', cliValue: 'Structured Data:Contains Structured Data' },
        missing: { label: 'Missing', cliValue: 'Structured Data:Missing' },
        validationErrors: { label: 'Validation Errors', cliValue: 'Structured Data:Validation Errors', },
        validationWarnings: { label: 'Validation Warnings', cliValue: 'Structured Data:Validation Warnings' },
        parseErrors: { label: 'Parse Errors', cliValue: 'Structured Data:Parse Errors' }
      }
    },

    sitemaps: {
      label: 'Sitemaps',
      filters: {
        all: { label: 'All', cliValue: 'Sitemaps:All', primary: true },
        urlsInSitemap: { label: 'URLs In Sitemap', cliValue: 'Sitemaps:URLs In Sitemap' },
        urlsNotInSitemap: { label: 'URLs Not In Sitemap', cliValue: 'Sitemaps:URLs Not In Sitemap', primary: true },
        orphanUrls: { label: 'Orphan URLs In Sitemap', cliValue: 'Sitemaps:Orphan URLs In Sitemap' },
        nonIndexable: { label: 'Non-Indexable URLs In Sitemap', cliValue: 'Sitemaps:Non-Indexable URLs In Sitemap' }
      }
    },

    pageSpeed: {
      label: 'PageSpeed',
      filters: {
        all: { label: 'All', cliValue: 'PageSpeed:All', },
        poorPerformance: { label: 'Poor Performance', cliValue: 'PageSpeed:Poor Performance' },
        needsImprovement: { label: 'Needs Improvement', cliValue: 'PageSpeed:Needs Improvement' },
        goodPerformance: { label: 'Good Performance', cliValue: 'PageSpeed:Good Performance' }
      }
    },

    amp: {
      label: 'AMP',
      filters: {
        all: { label: 'All', cliValue: 'AMP:All', },
        containsAmp: { label: 'Contains AMP Link', cliValue: 'AMP:Contains AMP Link' },
        missingAmp: { label: 'Missing AMP Link', cliValue: 'AMP:Missing AMP Link' },
        missingCanonical: { label: 'Missing Non-AMP Canonical', cliValue: 'AMP:Missing Non-AMP Canonical' },
        validationErrors: { label: 'AMP Validation Errors', cliValue: 'AMP:AMP Validation Errors' }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BULK EXPORTS - Exportaciones masivas (--bulk-export)
  // ═══════════════════════════════════════════════════════════════
  bulkExports: {
    links: {
      label: 'Links',
      items: {
        allInlinks: { label: 'All Inlinks', cliValue: 'Links:All Inlinks', },
        allOutlinks: { label: 'All Outlinks', cliValue: 'Links:All Outlinks', },
        allAnchorText: { label: 'All Anchor Text', cliValue: 'Links:All Anchor Text' },
        externalLinks: { label: 'External Links', cliValue: 'Links:External Links' },
        internalNofollowOut: { label: 'Internal Nofollow Outlinks', cliValue: 'Links:Internal Nofollow Outlinks' },
        noAnchorText: { label: 'Internal Outlinks With No Anchor Text', cliValue: 'Links:Internal Outlinks With No Anchor Text' },
        nonDescriptiveAnchor: { label: 'Non-Descriptive Anchor Text', cliValue: 'Links:Non-Descriptive Anchor Text In Internal Outlinks' },
        followNofollowInlinks: { label: 'Follow & Nofollow Inlinks', cliValue: 'Links:Follow & Nofollow Internal Inlinks To Page' },
        nofollowInlinksOnly: { label: 'Nofollow Inlinks Only', cliValue: 'Links:Internal Nofollow Inlinks Only' }
      }
    },

    responseCodes: {
      label: 'Response Codes',
      items: {
        redirectChains: { label: 'Redirect Chains', cliValue: 'Response Codes:Redirect Chains', },
        redirectLoops: { label: 'Redirect Loops', cliValue: 'Response Codes:Redirect Loops', },
        clientError4xxInlinks: { label: '4XX Inlinks', cliValue: 'Response Codes:Client Error (4XX) Inlinks' },
        serverError5xxInlinks: { label: '5XX Inlinks', cliValue: 'Response Codes:Server Error (5XX) Inlinks' }
      }
    },

    urlData: {
      label: 'URL Data',
      items: {
        allUrls: { label: 'All URLs', cliValue: 'URL:All URLs', },
        urlsBySegment: { label: 'URLs by Segment', cliValue: 'URL:URLs by Segment' }
      }
    },

    images: {
      label: 'Images',
      items: {
        imageDetails: { label: 'All Image Details', cliValue: 'Images:All Image Details', },
        missingAltInlinks: { label: 'Missing Alt Text Inlinks', cliValue: 'Images:Missing Alt Text Inlinks' },
        oversizedImages: { label: 'Oversized Images Details', cliValue: 'Images:Oversized Images Details' }
      }
    },

    canonicals: {
      label: 'Canonicals',
      items: {
        canonicalChains: { label: 'Canonical Chains', cliValue: 'Canonicals:Canonical Chains', },
        nonIndexableCanonical: { label: 'Non-Indexable Canonical', cliValue: 'Canonicals:Non-Indexable Canonical Details' }
      }
    },

    content: {
      label: 'Content',
      items: {
        duplicateDetails: { label: 'Duplicate Details', cliValue: 'Content:Duplicate Details', },
        nearDuplicateDetails: { label: 'Near Duplicate Details', cliValue: 'Content:Near Duplicate Details' },
        spellingErrorDetails: { label: 'Spelling Error Details', cliValue: 'Content:Spelling Error Details' },
        grammarErrorDetails: { label: 'Grammar Error Details', cliValue: 'Content:Grammar Error Details' }
      }
    },

    web: {
      label: 'Web',
      items: {
        allPageSource: { label: 'All Page Source', cliValue: 'Web:All Page Source' },
        screenshots: { label: 'Screenshots', cliValue: 'Web:Screenshots' },
        allPdfDocuments: { label: 'All PDF Documents', cliValue: 'Web:All PDF Documents' },
        allPdfContent: { label: 'All PDF Content', cliValue: 'Web:All PDF Content' },
        allHttpRequestHeaders: { label: 'All HTTP Request Headers', cliValue: 'Web:All HTTP Request Headers', },
        allHttpResponseHeaders: { label: 'All HTTP Response Headers', cliValue: 'Web:All HTTP Response Headers', },
        allCookies: { label: 'All Cookies', cliValue: 'Web:All Cookies' }
      }
    },

    structuredData: {
      label: 'Structured Data',
      items: {
        allStructuredData: { label: 'All Structured Data', cliValue: 'Structured Data:All Structured Data', },
        validationErrorDetails: { label: 'Validation Error Details', cliValue: 'Structured Data:Validation Error Details' },
        validationWarningDetails: { label: 'Validation Warning Details', cliValue: 'Structured Data:Validation Warning Details' }
      }
    },

    javascript: {
      label: 'JavaScript',
      items: {
        jsRenderingIssues: { label: 'JS Rendering Issues', cliValue: 'JavaScript:JavaScript Rendering Issues' },
        renderedVsOriginal: { label: 'Rendered vs Original', cliValue: 'JavaScript:Rendered vs Original Content' },
        consoleErrors: { label: 'Console Errors', cliValue: 'JavaScript:Console Errors' }
      }
    },

    hreflang: {
      label: 'Hreflang',
      items: {
        allHreflang: { label: 'All Hreflang', cliValue: 'Hreflang:All Hreflang URLs', },
        hreflangClusters: { label: 'Hreflang Clusters', cliValue: 'Hreflang:Hreflang Clusters' },
        missingReturnLinks: { label: 'Missing Return Links Details', cliValue: 'Hreflang:Missing Return Links Details' }
      }
    },

    sitemaps: {
      label: 'Sitemaps',
      items: {
        sitemapUrls: { label: 'All Sitemap URLs', cliValue: 'Sitemaps:All Sitemap URLs', },
        sitemapDetails: { label: 'Sitemap Details', cliValue: 'Sitemaps:Sitemap Details' }
      }
    },

    analytics: {
      label: 'Analytics',
      items: {
        gaData: { label: 'Google Analytics Data', cliValue: 'Analytics:Google Analytics Data' },
        gscData: { label: 'Google Search Console Data', cliValue: 'Analytics:Google Search Console Data' }
      }
    }
  }
};
