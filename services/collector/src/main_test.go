// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"net/http/httptest"
	"os"
	"testing"
)

func TestHandler(t *testing.T) {
	tests := []struct {
		label  string
		want   string
		host   string
		detail string
	}{
		{
			label:  "default",
			want:   "Hello from nowhere !\n",
			host:   "",
			detail: "",
		},
		{
			label:  "overrideHost",
			want:   "Hello from privacy-sandbox-demos-collector.dev !\n",
			host:   "privacy-sandbox-demos-collector.dev",
			detail: "",
		},
		{
			label:  "overrideDetail",
			want:   "Hello from privacy-sandbox-demos-collector.dev !\nMy job is to protect your privacy\nLooking forward to working with you !\n",
			host:   "privacy-sandbox-demos-collector.dev",
			detail: "protect your privacy",
		},
	}

	originalHost := os.Getenv("COLLECTOR_HOST")
	defer os.Setenv("COLLECTOR_HOST", originalHost)

	originlDetail := os.Getenv("COLLECTOR_DETAIL")
	defer os.Setenv("COLLECTOR_DETAIL", originlDetail)

	for _, test := range tests {
		os.Setenv("COLLECTOR_HOST", test.host)
		os.Setenv("COLLECTOR_DETAIL", test.detail)

		req := httptest.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		handler(rr, req)

		if got := rr.Body.String(); got != test.want {
			t.Errorf("%s: got %q, want %q", test.label, got, test.want)
		}
	}
}
