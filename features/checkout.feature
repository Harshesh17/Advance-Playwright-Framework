@checkout @e2e @regression
Feature: TTACart end-to-end checkout
  As a signed-in shopper
  I want to complete the full purchase flow
  So that my order is confirmed

  Background:
    Given I am logged in as "standard_user"
    And I am on the "products" page

  @smoke
  Scenario: Standard user completes a purchase
    When I add product "tta-bike-light" to the cart
    And I add product "tta-bolt-tshirt" to the cart
    And I open the cart
    Then I should see 2 items in the cart
    When I proceed to checkout
    And I fill in checkout details with first name "Pramod" last name "Dutta" and postal code "560001"
    And I continue to the overview
    Then I should see the order overview
    When I finish the order
    Then I should see the success message "Thank you for your order!"

  Scenario: Missing first name blocks checkout
    When I add product "tta-bike-light" to the cart
    And I open the cart
    And I proceed to checkout
    And I fill in checkout details with first name "" last name "Dutta" and postal code "560001"
    And I continue to the overview
    Then I should see the checkout error "Error: First Name is required"

  Scenario: Missing postal code blocks checkout
    When I add product "tta-fleece-jacket" to the cart
    And I open the cart
    And I proceed to checkout
    And I fill in checkout details with first name "Pramod" last name "Dutta" and postal code ""
    And I continue to the overview
    Then I should see the checkout error "Error: Postal Code is required"

  @math
  Scenario: Overview total equals subtotal plus 8 percent tax
    When I add product "tta-bike-light" to the cart
    And I add product "tta-bolt-tshirt" to the cart
    And I open the cart
    And I proceed to checkout
    And I fill in checkout details with first name "Pramod" last name "Dutta" and postal code "560001"
    And I continue to the overview
    Then the overview total should equal subtotal plus tax
