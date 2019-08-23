# Projects

## Creating a project

The first step in getting started with projects in MAAP is going to MAAP's
gitlab and creating a new project. When you create a MAAP account, an account is
automatically configured for you on MAAP's (gitlab instance)[https://repo.nasa.maap.xyz/].

To sign in, click on `Sign in with CAS`, then use your URS or ESA login. This will direct
you to your projects.

![Welcome screen](./images/log_on.png)

Click on `Create a project`. Name your project and select it's visibility level:
- Projects will default to `private`, meaning only you can see it, and if you want to allow another
user to contribute, you will have to explicitly add them in the gitlab interface. **NOTE:**
Adding a user to a workspace that has a project in it does not automatically give them access
to your gitlab project, you must also add them to the private project if you want to
allow them to make changes.
- Projects set to `internal` can be seen by any authenticated MAAP user.
- Projects set to `public` can be seen by anyone, regardless of whether they are a MAAP
user or not.

![Settings for your new project](./images/first_project.png)

Once you have created a project, copy the https url for the project the can be found under 
the clone button's dropdown. You will use this to add your project to you Che workspace.

![Git clone url dropdown](./images/git_clone.png)

## Adding a project to your workspace

