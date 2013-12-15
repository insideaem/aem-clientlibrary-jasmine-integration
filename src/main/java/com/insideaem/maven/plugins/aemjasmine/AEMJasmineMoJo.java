package com.insideaem.maven.plugins.aemjasmine;

import java.io.File;
import java.util.List;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.logging.Log;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;
import org.codehaus.plexus.util.DirectoryScanner;

/*
 * Copyright 2013 InsideAEM.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

@Mojo(name = "test", defaultPhase = LifecyclePhase.TEST)
public final class AEMJasmineMoJo extends AbstractMojo {
	/**
	 * Location to generate the runner file.
	 */
	@Parameter(property = "runnerOutputDirectory", defaultValue = "${project.build.directory}")
	private File runnerOutputDirectory;

	/**
	 * Project the plugin is called from.
	 * 
	 */
	@Parameter(defaultValue = "${project}", readonly = true)
	private MavenProject project;

	/**
	 * Defines parameter for includes
	 * 
	 */
	@Parameter(property = "includes", defaultValue = "**/js.txt")
	private String[] includes;

	@SuppressWarnings("unchecked")
	public void execute() {
		project.getProperties().put("jasmine.sourceIncludes",
				"**/js.txt,**/a.js,**/b.js,**/c.js");
		this.getLog().info("----> jasmine.sourceIncludes property set");
	}

	/**
	 * Scans a set of directories.
	 * 
	 * @param roots
	 *            Directories to scan
	 */
	private void scan(List<String> roots) throws MojoExecutionException {
		for (String root : roots) {
			scan(new File(root));
		}
	}

	/**
	 * Scans a single directory.
	 * 
	 * @param root
	 *            Directory to scan
	 * @param writer
	 *            Where to write the source list
	 * @throws MojoExecutionException
	 *             in case of IO errors
	 */
	private void scan(File root) throws MojoExecutionException {
		final Log log = getLog();

		if (!root.exists()) {
			return;
		}

		log.info("scanning source file directory '" + root + "'");

		final DirectoryScanner directoryScanner = new DirectoryScanner();
		directoryScanner.setIncludes(includes);
		directoryScanner.setBasedir(root);
		directoryScanner.scan();

		for (String fileName : directoryScanner.getIncludedFiles()) {
			final File file = new File(root, fileName);
			try {
				this.getLog().info("Found file: " + file.getAbsolutePath());
			} catch (Exception e) {
				throw new MojoExecutionException(
						"io error while writing source list", e);
			}
		}
	}

}
