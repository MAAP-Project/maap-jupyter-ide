# Sharing

## Organizations

We are utilizing Eclipse Che’s Organizations feature to allow users to share workspaces 
with other MAAP users. If a workspace is created in an organization, a user can easily
share that workspace with other members of the organization. 

#### All users are in one shared organization

Users can be in multiple organizations, but there is one organization, called `maap-users` that
all users are in. This allows for users to be able to see all the possible MAAP users to
share with.

![User's organizations](./images/my_orgs.png)

#### All users have their own personal organization they can customize

Users all also have their own personal organization. Each user is the admin of their
own organization so they can easily curate groups and individuals that they share their
work with often. 

To add a user to your personal organization, use the `Add Member` button. Now you can share
any workspace in your personal organization with them!

![Adding a user to a personal organization](./images/add_user_to_my_org.png)

To create a group of users you want to share with, create a sub-organization in your
personal organization. In order to add someone to your sub-organization, you first must
add them to your personal organization. Organizations can be created in layers of
nesting sub-organizations, but for all organizations, you can only add members of
it's parent organization.

As you can see, your personal organization is really just a sub-organization of 
`maap-users`/

For example - if I wanted to create a group frequent collaborators of mine. 
1. Add each of them to my personal organization `maap-users\<my-name-here>`.
2. Create a sub-organization under `maap-users\<my-name-here>`, lets's call it
`maap-users\<my-name-here>\my-collaborators`.
3. Add each of my collaborators to my new sub-organization.


#### Creating workspaces in an organization's namespace

All workspaces are created under the namespace of an organization.
**NOTE: Once a workspace is created under an organization it cannot be moved to a 
different organization.**

To specify which organization you want a workspace to be a part of, specify using the
dropdown on workspace creation.

![Select organization in workspace creation](./images/create_workspace_in_org.png)

Once a workspace is created, it is not inherent that all memebers of that organization
are able to see it. You must share with them after it is created. This can be found in
workspace's `Share` tab.

![Share workspace with organization members](./images/share_my_workspace.png)


#### More documentation
For more documentation help on using organizations, check out Che's 
[guide](https://www.eclipse.org/che/docs/che-6/organizations.html). It is not specific
to MAAP's implementation, but most of the info will still apply!

## Sharing Data

Users who have access to a workspace have access to all the files contained in that workspace.

#### All users have their own personal s3-bucket folder mounted in the FileBrowser home

In `/projects`, each user has a personal s3-hosted folder with the same name as their CAS username.  Files in this 
folder are automatically uploaded to s3 and will accessible from any workspace a user signs into.

The intention of this mounted folder is that you can use this to share data with others, and also store files you
want to access across different workspaces. It is not intended that you do all of your work in this directory. Because
this directory is mounted to s3, you will notice that processes are slower when working in this directory.

![s3-hosted folder](./images/s3folder.png)

### Generating a shareable link to s3-hosted files

Users can create a shareable link for any files in their folder that is hosted on s3. To do this, go to 
`Command Palette` -> `User` -> `Get Presigned S3 URL` and enter the relative path to the file you want to share.  
The link will expire after 12 hours.

![s3-link-gif](./images/presignedurl.gif)

See [Notebook Magics](./notebook_magics.md) for how to get the presigned s3 url from an inline notebook command.

