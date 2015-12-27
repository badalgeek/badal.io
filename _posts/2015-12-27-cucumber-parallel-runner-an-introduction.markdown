---
layout: post
tags: java cucumber parallelCucumber
date: 2015-12-27 13:06
title: Cucumber Parallel Runner- An Introduction
published: true
identifier: 1
---

Cucumber Parallel Runner project is hosted on Github which allow you to run cucumber scenario in parallel 
with retries on failure if you are using spring as dependency injection. Other DI's are not yet modified.
Below article describe the problem with existing cucumber framework and solution which are considered in
resolving the problem. You can directly jump to below posts which walks through various ways the parallel
cucumber can be used:

| [Example 1]({% post_url 2015-12-27-cucumber-parallel-runner-example-1 %}) | Simple example where step definitions doesn't have to share state |
| [Example 2]() | Selenium example where step definitions have to share state |

I have been working on a project which uses cucumber and selenium combination to test UI and 
we use cucumber to test our services as well. In Selinium, it becomes very slow if test server is 
deployed on a saparate box and test is running on a remote host. It is comaparable to test server 
running on a test host and test cases running on Jenkins server. If number of test case reaches to 
400+ it takes hours running all the cases and if you follow continous integration(CI) and a large team
working on the project then code checkin are done for every 10-30 minutes, it's very hard for integration
test to keep up with the code checkins. And in SOA architecture where you don't have control on service
or portlets which you depend on, and in case any of them have temporary problem with them, then
test target would show a failiure just because a temporary problem.

From sometime my team was strugling with the both intermitant issues and long runtime of test cases.
I explored few options to resolve this problem:

* Dividing test cases in different Junit files and run them in parallel.
* Dumping failed cases in a file and rerun failed cases

None of above worked for use even if we divided the test cases in 10 subgroups but not able to run them in 
10-15 minutes. And even if rerun of failed case pass, it doesn't show the result of test target as success.

In the end you start looking for a solution which run cases in parallel and retry the tests as they 
fail. I did found solutions which add a retry but there was no solution which I can found to run cucumber cases
in parallel.

I started writing my own junit runner for cucumber which would take care of above problem but I soon realised that
solution would not possible without rewriting cucumber spring package, cucumber junit runner and reporting. Here is 
how object factory and reporting work in cucumber java framework and how did I solved the problem:

#### Object Factory
In cucumber If singleton bean is defined through SpringTestContext annotation, spring first look for a class
with this annotation and intialize all the defined bean in bean configuration. Then it go through all
the step definition files and register them as a bean in a scoped context, and when a senario is trigerred
it call spring to get the step definition object in bean scope and cucumber's test scope context caches all the 
step definition bean so you end up getting single copy of step object. 

But situation were not that simple if you have to share the selenium web driver for one senario since we don't 
want to loose the customer sesssion hence we would need to share state between step class which can be achived 
using any of below:

* Define shared object in step def itself and autowire step def in other step def
* Create a shared object, add it in spring context and autowire it to different step defenitions

##### Problem with making one step def on other step def
Since step def beans are added in runtime hence if step def A depends on stef def B and A got registered before
bean B then it would give an exception if you try to register the bean

##### Problem with shared bean across step definitions
Both the scope provided by spring would not work since creating singleton bean will make single object for
all parallel run and prototype would give different object to different step definitions. 

##### Problem with scoped context created by cucumber spring object factory


If we put the shared class in step def package and keep all the step def in sub package then it would resolve the first
problem and cucumber would create this bean in a scoped context but it doesn't work which I tried to explain using
below example.

If you have two scenarion A and B running in different `Scope A` and `Scope B` and you have two bean of step 
definition S(`S:ScopeA` and `S:ScopeB`) and T(`T:ScopeA` and `T:ScopeB`) which reqire an shared object (`O:ScopeA` and 
`O:ScopeB`). And when you ask spring to create object `S:ScopeA` with dependecy on shared object `O` it would 
throw exception because spring is not aware of scope which had created `O` object because spring treats `O:ScopeA` 
and `O:ScopeB` as two different bean of same interface and throw exception if end up having two beans with same 
interface. There is no way to tell spring to resolve dependency in scoped context. 

@Solution: One solution for this problem is to create child context for different scenario and have a parent context
which would maintain bean which supposed to be singleton and can be shared across scenarios running in different 
threads for which cucumber object factory needs to rewritten.

#### CucumberReporting
In cucumber there can be multiple reporting for same run and in runtime cucumber weave a new proxy class which call
all the configured reporting class and this proxy class in given to runtime to log different event and as soon as
events are given to reporting class they dump it in a file. By creating a simple adapter on top of proxy which 
would keep the events in memory until all the examples in a scenario are complete and would aggregate the result
of different example if present in a scenario.
