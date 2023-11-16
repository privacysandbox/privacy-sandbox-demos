# Aggregatable Report Converter

## Purpose

To provide Aggregation Service testers tools to create debug aggregatable reports that can be used for Local Testing and AWS Aggregation Service testing.

## Guide

1. Clone the privacy-sandbox-demos repository.
2. Go to \<repository\>/tools/aggregatable_report_converter
3. Options for usage:
   1. Use the jar file available in \<repository\>/tools/aggregatable_report_converter/out/artifacts/aggregatable_report_converter_jar.
   2. Build jar file for the project `aggregatable_report_converter` using Eclipse or Intellij.

### Build your jar file in Intellij

1. Open Project in Intellij
2. Go to `Build` > `Build Project`.
3. Go to `File` > `Project Structure`. Select `Artifacts` under `Project Settings`.
4. Click `+` > `JAR` > `From modules with dependencies...`.
5. Ensure `module` selected is `aggregatable_report_converter`.
6. In Main Class, select `Main`. Click `OK` > `Apply`.

## How to use

Once the jar file is created, you can get options available for this tool using the command `java -jar aggregatable_report_converter.jar --help`.

To convert json reports to debug aggregatable reports, you can use the below command:

```angular2html
java -jar aggregatable_report_converter.jar \
--request_type convertToAvro \
--input_file [filename] \
--debug
```

To create output domain avro file, you can use the below command:

```angular2html
java -jar aggregatable_report_converter.jar \
--request_type createDomainAvro \
--bucket_key [bucket key]
```

## Options

--request_type [request type] \
Type of request. Options available:

- convertToAvro: converts a json report to an avro aggregatable report
- convertToJson: converts the avro summary report to a json report
- createDomainAvro: creates an output_domain.avro file from provided bucket key

--input_file [file name] \
This will be the file that will be encoded.

--debug \
This will signify that the request is for debug. \
If the type of request is convertToAvro, this will create a debug avro report for local testing.

--bucket_key [bucket key] \
Provide your bucket key here.

--output_file [file name] \
Output filename the report will be written to.
