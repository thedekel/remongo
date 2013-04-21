# remongo

This is an experimental library designed to create a mongo accessibility layer
which utilizes controlled redundancy and a wrapper for mongo commmands which
allow data changes to be safely propogated to redundant instances of the
updated object.

The ideal use case for this would be any application that utilizes an object
oriented design in which a retrieval of a single object almost always requires
the retrieval of one or more related child or parent objects.

For example, if an application manages simple text micro-posts and text comments
that are made by authorized users, under remongo there will be three collections
in the database:

1. micro_posts
2. comments
3. users

however, remongo could be configured such that each `micro_posts` object would also
include the parent`user` object and the children `comments` objects such that the
result might be:

```JSON
{
  "body": "this is a post!",
  "id": "28739",
  "author": {
    "name": "the Dekel",
    "id": "123456",
    "email": "test@dekelite.com",
    "picture": "http://cdn.cdn.com/123456.jpg"
  },
  "comments": [{
    "id": "99203"
    "body":"lol!",
    "author": {
      "name": "someone else",
      "id": "123457",
      "email": "test2@dekelite.com",
      "picture": "http://cdn.cdn.com/123457.jpg"
    }
  },{
    "body":"this is a comment",
    "id": "99204",
    "author": {
      "name": "the Dekel",
      "id": "123456",
      "email": "test@dekelite.com",
      "picture": "http://cdn.cdn.com/123456.jpg"
    }
  }]
}
```

note that both the `micro_post` object annd each object in the `comments` array contain 
the same type of owning `author` object. A corresponding `user` object might look 
something like this:

```JSON
{
  "name": "the Dekel",
  "id": "123456",
  "email": "test@dekelite.com",
  "picture": "http://cdn.cdn.com/123456.jpg",
  "micro_posts": [{
    "id": "28739",
    "body": "this is a post!"
  }]
}
```

Just like how each `micro_posts` object contained an array of corresponding `comments`, 
each `user` would contain an array of `micro_posts`. Note that the only entry in the
`micro_posts` array is identicle to the one provided above with the exception that the
`author` field is missing (since it would cause a circular loop of references). When
using remongo, it's left to the developer to make the design choice of which fields are
public and appear when an object is embedded in another, and which ones are private and
can only be retrieved when the object itself is retrieved.

This method of object-embedding saves time when querying objects, but the tradeoff is that
an update will take longer to execute since that if the user were to change it's email to
`"test@newdomain.com"`, any post and comment that the user made will have to be updated
to reflect this change. 

Although this update seams tedious, mongo's ability to query based on fields of embedded
objects and update embedded objects makes it easier to execute. For example, all posts
made by the user can be changed by running:

```JavaScript
db.micro_posts.update({"author.id":"123456"}, {$set:{"author.email":"test@newdomain.com"}});
db.comments.update({"author.id":"123456"}, {$set:{"author.email":"test@newdomain.com"}});
```

Note that in this case, the email of the user as embedded within the comments that are 
retrieved along with a `micro_posts` object is unchanged. In order to update these e-mails
a second order of updates will be required which may be better if done by the application 
rather then left to the database system. 

This cost may seem high, but some systems can be designed to bypass this requirement (for
example only include the name and id of the user in the comment object), and other may
find that the `user` object updates so infrequently that the amortized cost of the update
is insignificant.
