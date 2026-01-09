# Login Lab - Test Runner Framework (Node + Selenium + Mochawesome)

Includes:
- Multiple mock login apps (Basic, CSRF, MFA, Lockout)
- Mocha test suites using Selenium WebDriver
- Mochawesome HTML report generated per run
- Screenshots captured on failure and shown in UI

## Ports
- UI: http://localhost:31010
- API: http://localhost:41010
- Mock apps:
  - Basic: http://localhost:51010
  - CSRF: http://localhost:51011
  - MFA: http://localhost:51012
  - Lockout: http://localhost:51013

## Run
```bash
docker compose up --build
```
Open UI and run tests.

Artifacts are served via the API at `/artifacts/...`

---

# Test Automation Framework Activity - Technical Prerequisites and Submission Guidelines 

Thank you for your interest in the Senior Software Developer in Test position here at HMCTS.  As part of our interview process. We appreciate your time and effort in completing this activity, which will help us assess your technical skills in test automation. 

In this technical challenge, we would like you to showcase the following: 

Proficiency in Programming 
Familiarity with Test Automation Frameworks 
Web Application Testing Proficiency 
Version Control Skills 
Development Environment Setup 
Please keep these requirements in mind as you proceed with the activity. We value your skills and expertise in these areas and look forward to seeing your implementation. 

**Documentation and Submission Guidelines:**
 
The deadline for submitting the completed activity will be confirmed by our recruitment department.  
Package your code and any supporting files in a ZIP file or share a repository link if applicable. 
Provide clear instructions on how to submit your code, including any specific steps or guidelines. 
If you have any questions or need further clarification on the technical prerequisites or submission guidelines, please feel free to reach out to us. 

**Interview Preparation:** 
Be prepared to present your code, explain your design choices, and discuss any challenges you encountered during the interview. 
Think about potential improvements you would make given additional time to work on the activity. 
We look forward to receiving your completed Test Automation Framework Activity and discussing your approach during the interview. Best of luck! 
 
**Activity: Implement Test Automation Framework Objective:**

Implement a test automation framework for a simple web application of your choice that tests the login functionality. 

Instructions: 

Use any programming language (Java, Python, C#, or JavaScript) and test automation framework of your choice such as Selenium WebDriver, Playwright, Cypress, TestNG, JUnit, NUnit, PyTest, or Jasmine. 
Create a new test project/repository. 
Set up the necessary dependencies and configurations for the test framework. 
Write test cases to automate the login functionality of a web application.  
The test cases should cover both positive and negative scenarios. 
Include test data setup and teardown steps as necessary. 
Utilise appropriate design patterns and best practices for test automation. 
Implement logging and reporting mechanisms to track test execution and results. 
Handle any necessary waits, assertions, and exception handling in your tests. 
Use version control to manage your code changes. 
Deliverables: 

The source code of the test automation framework. 
A README file with instructions on how to set up and run the tests. 
A brief explanation of your design choices and any additional improvements you would make if given more time. 
 
During the interview, you will need to showcase your proficiency with this framework, and your coding abilities will be evaluated through a brief live coding exercise. 

The use of AI coding assistants is permitted. However, please ensure the submission represents your own understanding, as you will be required to explain, justify and extend your code during the interview.
