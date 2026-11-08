package com.epoch.epoch_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
public class EpochBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EpochBackendApplication.class, args);
	}

}
