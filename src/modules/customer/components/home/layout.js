/**
 * Shared spacing for the customer landing sections.
 *
 * The reference design is a fixed 48px desktop gutter; these classes step it
 * down for tablet and phone so every section stays aligned to the same rhythm.
 * Import instead of re-typing the padding on each section.
 */
export const SECTION_X = 'px-4 sm:px-6 lg:px-12'
export const SECTION_MAX = 'mx-auto w-full max-w-[1440px]'
export const SECTION = `${SECTION_MAX} ${SECTION_X}`
