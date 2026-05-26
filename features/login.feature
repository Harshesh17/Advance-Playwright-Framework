@login @smoke
Feature: TTACart login
  As a shopper using TTACart by The Testing Academy
  I want to authenticate with one of the documented test users
  So that I can browse and buy items

  Background:
    Given I am on the "login" page

  @standard
  Scenario: Standard user signs in successfully
    When I login as "standard_user" with password "tta_secret"
    Then I should land on the "products" page
    And I should see the page title "Products"

  @locked @regression
  Scenario: Locked-out user is blocked
    When I login as "locked_out_user" with password "tta_secret"
    Then I should see the login error "Epic sadface: Sorry, this user has been locked out."

  @glitch @regression
  Scenario: Performance-glitch user eventually reaches products
    When I login as "performance_glitch_user" with password "tta_secret"
    Then I should land on the "products" page within 10 seconds

  @negative @regression
  Scenario: Wrong password is rejected
    When I login as "standard_user" with password "wrong_password"
    Then I should see the login error "Epic sadface: Username and password do not match any user in this service"

  @negative
  Scenario: Empty username is blocked by form validation
    When I login as "" with password "tta_secret"
    Then I should remain on the "login" page

  @problem @regression
  Scenario: Problem user lands on the products page
    When I login as "problem_user" with password "tta_secret"
    Then I should land on the "products" page
    And I should see the page title "Products"
