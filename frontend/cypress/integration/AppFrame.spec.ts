/// <reference types="cypress" />

describe('AppFrame Cypress Tests', () => {
  it('hides title when scrolling', () => {
    cy.visit('http://localhost:3000/lorem-ipsum')
    cy.get('title').should('be.visible')
    cy.scrollTo(0,500)
    cy.get('title').should('not.be.visible')
  })

  it.only('has a title with less than 25% height', async () => {
    cy.visit('http://localhost:3000/lorem-ipsum')
    const windowHeight = window.outerHeight
    cy.get('header').invoke('height').should('be.within', 1, windowHeight*0.25)
  })
})