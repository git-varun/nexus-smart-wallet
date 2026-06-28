# General Availability Accessibility Report

## 1. Screen Reader & ARIA Compliance
* All interactive controls (buttons, selects, dialog headers, settings menus) feature explicit, descriptive `aria-label`, `aria-expanded`, and `aria-hidden` states.
* Semantic HTML5 tags (`main`, `nav`, `section`, `header`, `footer`) are strictly utilized to define document layout hierarchy.

## 2. Dialog and Form Usability
* Modals (Dialogs) implement focus trapping and restore focus to the triggering element upon closure.
* Forms (login, registration, transaction transfer, custom session key creation) support keyboard tab order and feature visible focus indicators.
* Accessibility errors and field validations are communicated using active status regions (`role="alert"` and live announcements).

## 3. Visual and Motion Settings
* Color contrast conforms to WCAG AA guidelines (contrast ratio >= 4.5:1).
* Motion transitions (using `framer-motion`) respect the user's operating system reduced-motion preference (`useReducedMotion` hook).
