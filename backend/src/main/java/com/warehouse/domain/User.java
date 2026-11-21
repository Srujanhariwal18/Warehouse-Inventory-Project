package com.warehouse.domain; import jakarta.persistence.*; import java.util.*;
@Entity @Table(name="users") public class User { @Id @GeneratedValue public UUID id; @Column(name="clerk_id",unique=true) public String clerkId; public String email; @Column(name="display_name") public String displayName; @Enumerated(EnumType.STRING) public Role role=Role.STAFF; }
