# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  type        = string
  description = "The ID of the project where the service account will be created."
}

resource "google_secret_manager_secret" "envoy_tls_termination_key" {
  project   = var.project_id
  secret_id = "envoy-tls-termination-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "envoy_tls_termination_key" {
  secret      = google_secret_manager_secret.envoy_tls_termination_key.id
  secret_data = <<EOT
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC8Xer29Ko4WlI8
zyGMyUdPgSrcSZn8sreNRpZ3shAwJG96XrDdmPtCaPDPw+YN0nplrYmQ5Sxceitm
raBUl1PpEgPje/JxfLMtRsk1S7gfKMW24gqsleraV9ZBqin9EeroefmIaDv/otAK
GjV6Ty/j5rZl49vMMLeRDs2rN9Oi9ukdaoMWNXyPNTpm1yt4b8PB+ZVVNYKHLb2r
Hf1+Fa1NBLMixtBLd/UquNmlJzSNBoulqbBlmyObbGEwMaxI7KHNbP88YmGhp5KM
cWo/2PC13fSM71OiuaLUoHRG9JfEWqya9NtmNNhnf1KTQXwA2u5Fe7Wc+4mRhdjP
BOP26NSTAgMBAAECggEBALrgCg166a0CnnfJnqVHwsFzigwF0QlMXKGCGCEjvL+m
RhqG+ry92vglmFLnLMMlv1xEcCgZ1IrigVBajKefghXGU6lJ/FrutewDP/bp6f6v
uocXdjOGf/qiDeQTZ5i0P/Lnn9HeZzfUVMTQ/6EaEo7tAqPPDO5knpkAsLZeqk4P
JzUaqoZdMRXuq9qmJZl9vyRj1rRqS99+JV6Oody9+SO2a6hKQqH8w7EfLTTcULqp
ZYHXdx6CnOMudf8F7fqBLvWL0piCeyfGX3JXxmujgu4XUMf6Y/jnV2O97ZGmALYh
S2N2huP3dloxKUacubILlruqDBtL0s/o9x4MMSyNtqECgYEA5ptbRQXT8svxJ3hB
DkT0JMTV2NXZ4EfA5RRTMRzr0vgoryIFWq77Gu056kRtM1/ymWSJiPj18lWAraqi
wv6ywHx8W3Pdp2vrnMsaqnCI8LkrF5iKbJF0GSSrLjckND+WFfwGGbbfqxa21peo
8dRl2+tIwBzqaa7dtQ7vESNS9RsCgYEA0RvYi8KQXQ+w9Xelcflgs+NKc73jKC6k
3xc+toGHgfRZK+C6vRbfF1c+Kf1JRXpOFbmpE4RjgPVdWk+Pue/6Gs6J//SxCDFF
ZqMINB07vGpeh3AP90C6P4zc8YUsSRsw9F/hQgSDLhStWZxFqChbfdBjU5kf5asf
/z81vjEWLekCgYBufPD12Rz7r4sThiJlW9Q96bEr+wow0zAwkdRqK5kxs4SKpJo8
IKpe9FpTTAWmH8p0hB8BaYctXJoSmzbwhmfOodZTWuhQVvzEWuujzddOvulOnN91
tRsTEOaTdgf6oJygW+fwWhZAOtnPZ0qi00kaXVi18yS9DfNb1JPmei49EQKBgQDP
MpJNWcqGC8hCUf2jg4Cofm0FZoAxDpbbX0MKwCovQJki+xjNyF3h2NaF8K2rpFa+
/CpmZmXaIEYR+Ifnq7vc2A6xihnojjnAS4cTbGwGdDeaaBXJ318tHTzILDcHcWP+
oQqoyaPaAy8JfekfiG2vqs7gxPdwMTIRTubHwAfEEQKBgQC3XlPy/r5r7q2O5iwW
d6UJdh0V+h4zMyenMWRixF1aokNxc9V6GZfK3Lj2tSzjCCHsUkiil8DukB4NVRGW
KX6inN4S29QarQSdfDW2PvEko0JyfejK5VY2dl8GvGldDhNIt0i9UtXdk6bqcRpy
lq0bHiQyycFfivMIGsQMP+qVjg==
-----END PRIVATE KEY-----
EOT
}

resource "google_secret_manager_secret" "envoy_tls_termination_cert" {
  project   = var.project_id
  secret_id = "envoy-tls-termination-cert"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "envoy_tls_termination_cert" {
  secret      = google_secret_manager_secret.envoy_tls_termination_cert.id
  secret_data = <<EOT
-----BEGIN CERTIFICATE-----
MIIEaDCCAtCgAwIBAgIRAN1DWyoIZOr/6En495nTwsowDQYJKoZIhvcNAQELBQAw
gZsxHjAcBgNVBAoTFW1rY2VydCBkZXZlbG9wbWVudCBDQTE4MDYGA1UECwwvZGFu
a29jb2pAZGFua29jb2ouYy5nb29nbGVycy5jb20gKERhbmllbCBLb2NvaikxPzA9
BgNVBAMMNm1rY2VydCBkYW5rb2NvakBkYW5rb2Nvai5jLmdvb2dsZXJzLmNvbSAo
RGFuaWVsIEtvY29qKTAeFw0yMjExMjIyMTMxMDhaFw0yNTAyMjIyMTMxMDhaMGMx
JzAlBgNVBAoTHm1rY2VydCBkZXZlbG9wbWVudCBjZXJ0aWZpY2F0ZTE4MDYGA1UE
CwwvZGFua29jb2pAZGFua29jb2ouYy5nb29nbGVycy5jb20gKERhbmllbCBLb2Nv
aikwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8Xer29Ko4WlI8zyGM
yUdPgSrcSZn8sreNRpZ3shAwJG96XrDdmPtCaPDPw+YN0nplrYmQ5SxceitmraBU
l1PpEgPje/JxfLMtRsk1S7gfKMW24gqsleraV9ZBqin9EeroefmIaDv/otAKGjV6
Ty/j5rZl49vMMLeRDs2rN9Oi9ukdaoMWNXyPNTpm1yt4b8PB+ZVVNYKHLb2rHf1+
Fa1NBLMixtBLd/UquNmlJzSNBoulqbBlmyObbGEwMaxI7KHNbP88YmGhp5KMcWo/
2PC13fSM71OiuaLUoHRG9JfEWqya9NtmNNhnf1KTQXwA2u5Fe7Wc+4mRhdjPBOP2
6NSTAgMBAAGjXjBcMA4GA1UdDwEB/wQEAwIFoDATBgNVHSUEDDAKBggrBgEFBQcD
ATAfBgNVHSMEGDAWgBQkq9fd2gnVl5uTLLvccD36dkSHGDAUBgNVHREEDTALggls
b2NhbGhvc3QwDQYJKoZIhvcNAQELBQADggGBAJxVLCW415Lq/29QRWfidcBtGfGF
Egf9s9j/M9YLknpRGe4OTMWMES0MFnOyxmLHKdBAxXhV0tDtmSN3TZXNtI/f0A7D
dUJAoAJsiEwkkBIyh6Q4xLe1MR8XUVQi18DDz74VZa6ZMkffWhhoKhLA8LG35Agr
wnWQFeBw5giO9JWTnAC5jiqtz+wMD+avspewdZlvBF0M6cmsRpVX1gkTi4Rod06O
wMI6FHlR9P7zIEYzIIbN0129/bR1pVjOZSX+PISKhTPDYU/AvFX/L7s4Zzb9RhD2
kSx2XwQRXQIeL7jE7uCriM6nlaiyWi86c8EhzDdvpLUxhgmgK7V2Oq7CUly6recx
Vy1bllpso+ZrW5h0bifMRI9ShPZkBdYOfr6GPtxPHBJieTMzaQWtp4G34/e4/71+
QJu4D31p6AhQJitOaNwng0U31E+HLJNh/hb4YEO2R6FxXnqd05AU1kGp7u6Me76N
vhZzX/nWZUgSmC+c7FqxyP1rjnosG1NEpR7HAQ==
-----END CERTIFICATE-----
EOT
}
