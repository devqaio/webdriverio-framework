@search @regression
Feature: Search Functionality
  As a user
  I want to search for content on the website
  So that I can quickly find what I am looking for

  Background:
    Given I am on the home page

  @smoke
  Scenario: Search returns relevant results
    When I search for "automation testing"
    Then I should see search results
    And the search results should contain "automation"

  @regression
  Scenario: Search with no results
    When I search for "xyznonexistentquery123"
    Then I should see a no results message

  @regression
  Scenario: Search results can be sorted
    When I search for "testing"
    And I should see search results
    When I sort results by "Most Recent"
    Then the search results should be sorted

  @regression
  Scenario Outline: Search with different queries
    When I search for "<query>"
    Then I should see search results

    Examples:
      | query              |
      | webdriverio        |
      | cucumber bdd       |
      | test automation    |
