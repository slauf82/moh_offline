# MOH Offline

**Clinical Workflow & Documentation System**

🇩🇪 **Deutsch:** [README_DE.md](README_DE.md)

## Overview

MOH Offline is a modern standalone version of a long-running clinical
documentation and examination system.

The project removes the dependency on the original application server
while preserving medical workflows and extending them with new
process-oriented features.

## Features

-   Offline operation
-   Clinical documentation
-   Rule-based workflow guidance
-   Examination sequencing
-   Automatic score calculation
-   Chapter status evaluation
-   Process fidelity validation
-   Modern web-based user interface
-   Import, export and reporting
-   Long-term maintainability

## Process Fidelity

A central feature is the rule-based process engine.

Instead of validating only data completeness, MOH evaluates whether
examinations follow medically meaningful workflows.

Examples:

-   Follow-up examinations can depend on previous visits.
-   Workflow status is visualized.
-   Automatically calculated values are excluded from manual
    completeness checks.

## Technology

-   Java
-   Spring Boot
-   React
-   TypeScript
-   Vite

## Goal

Preserve valuable clinical workflows while creating a maintainable,
offline-capable and future-proof application.

## License

GNU GPL v3.0
