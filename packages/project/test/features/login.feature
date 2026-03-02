@login @smoke
Feature: User Login
  As a registered user
  I want to log in to the application
  So that I can access my account and personalised features

  Background:
    Given I am on the login page

  @smoke @critical
  Scenario: Successful login with valid credentials
    When I enter username "standard_user"
    And I enter password "secret_password"
    And I click the login button
    Then I should be redirected to the home page
    And I should see a welcome message

  @regression
  Scenario: Login fails with invalid password
    When I enter username "standard_user"
    And I enter password "wrong_password"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  @regression
  Scenario: Login fails with empty credentials
    When I click the login button
    Then I should see an error message

  @regression
  Scenario Outline: Login with multiple user roles
    When I enter username "<username>"
    And I enter password "<password>"
    And I click the login button
    Then I should be redirected to the home page

    @data-driven
    Examples:
      | username       | password        |
      | admin_user     | admin_pass      |
      | standard_user  | secret_password |
      | editor_user    | editor_pass     |

  @regression
  Scenario: Remember me functionality
    When I enter username "standard_user"
    And I enter password "secret_password"
    And I check the remember me checkbox
    And I click the login button
    Then I should be redirected to the home page
