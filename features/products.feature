@products @regression
Feature: TTACart product browsing
  As a signed-in shopper
  I want to sort, filter, and add products to my cart
  So that I can prepare an order

  Background:
    Given I am logged in as "standard_user"
    And I am on the "products" page

  Scenario: Product grid renders six items
    Then I should see 6 products in the grid

  @sort
  Scenario Outline: Sorting the catalog by <option> produces the expected order
    When I sort the products by "<option>"
    Then the products should be ordered "<direction>" by "<key>"

    Examples:
      | option | direction  | key   |
      | az     | ascending  | name  |
      | za     | descending | name  |
      | lohi   | ascending  | price |
      | hilo   | descending | price |

  @filter
  Scenario Outline: Finding "<query>" in the catalog
    Then the catalog should contain a product whose name includes "<query>"

    Examples:
      | query        |
      | Backpack     |
      | Bike Light   |
      | Fleece       |
      | Onesie       |
      | T-Shirt      |

  @cart @smoke
  Scenario: Adding a product to the cart updates the badge
    When I add product "tta-bike-light" to the cart
    Then the cart badge should show "1"
    When I add product "tta-bolt-tshirt" to the cart
    Then the cart badge should show "2"

  Scenario: Removing a product from the products page decrements the badge
    Given I add product "tta-bike-light" to the cart
    When I remove product "tta-bike-light" from the cart
    Then the cart badge should not be visible
