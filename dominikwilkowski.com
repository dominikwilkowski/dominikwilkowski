# NGINX CONFIG FOR DOMINIK-WILKOWSKI.COM
#
server_tokens  off;

# prevent clickjacking attacks
add_header  X-Frame-Options SAMEORIGIN;

# disallow circumventing declared MIME types
add_header  X-Content-Type-Options nosniff;

# X-XSS-Protection
add_header  X-XSS-Protection '1; mode=block';

# HSTS (ngx_http_headers_module is required) (15768000 seconds = 6 months)
add_header  Strict-Transport-Security 'max-age=31536000; includeSubDomains;' always;

# CORS
add_header  'Access-Control-Allow-Origin' '*';
add_header  'Access-Control-Allow-Credentials' 'true';
add_header  'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
add_header  'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';


# http to https redirect
#
server {
	server_name  www.dominik-wilkowski.com dominik-wilkowski.com;
	root         /var/www/html/dominikwilkowski;
	return 301   https://dominik-wilkowski.com$request_uri;
}


# www to https redirect
#
server {
	listen       443 ssl;
	listen       [::]:443 ssl;
	server_name  www.dominik-wilkowski.com;

	ssl on;
	ssl_certificate            /etc/letsencrypt/live/dominik-wilkowski.com/fullchain.pem;
	ssl_certificate_key        /etc/letsencrypt/live/dominik-wilkowski.com/privkey.pem;
	ssl_session_timeout        1d;
	ssl_session_cache          shared:SSL:50m;
	ssl_session_tickets        off;
	ssl_protocols              TLSv1 TLSv1.1 TLSv1.2;
	ssl_prefer_server_ciphers  on;
	ssl_dhparam                /etc/nginx/ssl/dhparam.pem;
	ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';  #generate here: https://mozilla.github.io/server-side-tls/ssl-config-generator/
	ssl_stapling               on;
	ssl_stapling_verify        on;

	location ~ /\.ht {
		deny  all;
	}

	return 301  https://dominik-wilkowski.com$request_uri;
}


# ssl and http2 config
#
server {
	listen       443 ssl http2;
	listen       [::]:443 ssl http2;
	server_name  dominik-wilkowski.com;
	root         /var/www/html/dominikwilkowski;

	ssl on;
	ssl_certificate      /etc/letsencrypt/live/dominik-wilkowski.com/fullchain.pem;
	ssl_certificate_key  /etc/letsencrypt/live/dominik-wilkowski.com/privkey.pem;

	ssl_session_timeout  1d;
	ssl_session_cache    shared:SSL:50m;
	ssl_session_tickets  off;

	ssl_protocols              TLSv1 TLSv1.1 TLSv1.2;
	ssl_prefer_server_ciphers  on;
	ssl_dhparam                /etc/nginx/ssl/dhparam.pem;
	ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';  #generate here: https://mozilla.github.io/server-side-tls/ssl-config-generator/

	# OCSP Stapling ---
	# fetch OCSP records from URL in ssl_certificate and cache them
	ssl_stapling         on;
	ssl_stapling_verify  on;

	# root server
	#
	location / {
		root   /var/www/html/dominikwilkowski;
		index  index.html index.htm;
	}


	# deny access to .htaccess files, if Apache's document root
	# concurs with nginx's one
	#
	location ~ /\.ht {
		deny  all;
	}


	# NodeJS proxy
	#
	location /status/api/ {
		proxy_redirect          off;
		proxy_pass_header       Server;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header        X-Scheme $scheme;
		proxy_set_header        Host $http_host;
		proxy_set_header        X-NginX-Proxy true;
		proxy_connect_timeout   5;
		proxy_read_timeout      240;
		proxy_intercept_errors  on;

		proxy_pass              http://127.0.0.1:8080;
	}
}